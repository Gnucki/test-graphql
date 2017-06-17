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

const createNetworkInterface = ApolloClient.createNetworkInterface;
const client = new ApolloClient.ApolloClient({
  networkInterface: createNetworkInterface({
    uri: `http://localhost:${config.server.port}/graphql`
  })
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

      const typeResponse = await client.query({query});
      const type = typeResponse.data.__type; // eslint-disable-line

      const fields = type.fields
        ? type.fields.map((field) => {
          const args = field.args.map(arg => (
            `${arg.name}: ${arg.type.name}`
          ));
          const argsDefinition = args.length === 0
            ? ''
            : `(${args.join(', ')})`;

          return `${field.name}${argsDefinition}: ${field.type.name}`;
        })
        : '';

      return `type ${type.name} {
        ${fields}
      }`;
    }
  ));

  console.log('---', typesDefinitions.filter(typeDefinition => typeDefinition));

  const schema = makeExecutableSchema({
    typeDefs: typesDefinitions.filter(typeDefinition => typeDefinition),
    resolvers: {
      Query: {
        user(obj, args, context/* , info */) {
          console.log('... Query user ...');
          console.log('obj:', obj);
          console.log('args:', args);
          console.log('context:', context);
          // console.log('info:', info);

          // TODO: forward request and response.

          return null;
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
