'use strict';

require('isomorphic-fetch');
const Koa = require('koa'); // koa@2
const KoaRouter = require('koa-router'); // koa-router@next
const koaBody = require('koa-bodyparser'); // koa-bodyparser@next
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;
const ApolloClient = require('apollo-client');
const gql = require('graphql-tag');
const config = require('./config');
const graphql = require('graphql');

console.log(Object.keys(graphql));

const createNetworkInterface = ApolloClient.createNetworkInterface;
const networkInterface = createNetworkInterface({
  uri: `http://localhost:${config.server.port}/graphql`
});
networkInterface.use([{
  applyMiddleware(req, next) {
    console.log('////', req.query);
    next();
  }
}]);
const client = new ApolloClient.ApolloClient({
  networkInterface
});

const app = new Koa();
const router = new KoaRouter();

// koaBody is needed just for POST.
app.use(koaBody());

module.exports = async function start() {
  const typesResponse = await client.query({
    query: gql`
      {
        __schema {
          types {
            name
          }
        }
      }
    `
  });
  const types = typesResponse.data.__schema.types; // eslint-disable-line

  const typesDefinitions = await Promise.all(types.map(
    async (typeItem) => {
      if (/^__/.test(typeItem.name)) {
        return null;
      }

      const query = gql`
        {
          __type(name: "${typeItem.name}") {
            name
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
              args {
                name
                description
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
                defaultValue
              }
            }
          }
        }
      `;

      function formatType(type) {
        let formattedType;

        switch (type.kind) {
          case 'LIST':
            formattedType = `[${type.ofType.name}]`;
            break;
          case 'NON_NULL':
            formattedType = `${type.ofType.name}!`;
            break;
          default:
            formattedType = type.name;
        }

        return formattedType;
      }

      const typeResponse = await client.query({query});
      const type = typeResponse.data.__type; // eslint-disable-line

      const fields = type.fields
        ? type.fields.map((field) => {
          const args = field.args.map(arg => (
            `${arg.name}: ${formatType(arg.type)}`
          ));
          const argsDefinition = args.length === 0
            ? ''
            : `(${args.join(', ')})`;
          const fieldType = formatType(field.type);

          return `${field.name}${argsDefinition}: ${fieldType}`;
        })
        : [];

      return `type ${type.name} {
  ${fields.join('\n  ')}
}`;
    }
  ));

  const schema = makeExecutableSchema({
    typeDefs: typesDefinitions.filter(typeDefinition => typeDefinition),
    resolvers: {
      Query: {
        user: async (obj, args, context, info) => {
          const fields = info.fieldNodes || info.fieldASTs;
          const querystring = `query GetUser {
${graphql.print(fields)}
}`;

          console.log('... Query user ...');
          console.log('obj:', obj);
          console.log('args:', args);
          console.log('context:', context);
          console.log('info:', info);
          console.log('query:', querystring);

          /*function formatArgs(node) {
            if (node.arguments.length === 0) {
              return '';
            }

            const fieldArgs = node.arguments.map((arg) => {
              let argValue;

              switch (arg.value.kind) {
                case 'StringValue':
                  argValue = `"${arg.value.value}"`;
                  break;
                default:
                  argValue = arg.value.value;
              }

              return `${arg.name.value}: ${argValue}`;
            });

            return `(${fieldArgs.join(', ')})`;
          }

          function formatField(node, offset = 0) {
            let tabulation = '';
            for (let i = 0; i <= offset; i++) {
              tabulation += '  ';
            }

            const selections = node.selectionSet
              ? node.selectionSet.selections.map(selection => formatField(selection, offset + 1))
              : null;
            const selectionSet = selections
              ? ` {
${selections.join('\n')}
${tabulation}}`
              : '';
            const fieldArgs = formatArgs(node);

            return `${tabulation}${node.name.value}${fieldArgs}${selectionSet}`;
          }

          const querystring = `query GetUser {
${formatField(fields[0])}
}`;

          console.log('... Forwarded query user ...');*/
          console.log('query:', querystring);

          const query = gql`${querystring}`;

          const response = await client.query({query});

          console.log('... Response user ...');
          console.log('user:', response.data[info.fieldNodes[0].name.value]);

          return response.data[info.fieldNodes[0].name.value];
        }
      }
    }
  });

  router.post('/graphql', graphqlKoa({schema}));
  router.get('/graphql', graphqlKoa({schema}));

  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(config.proxy.port);

  console.log(`Server listening on port ${config.proxy.port}.`);
};
