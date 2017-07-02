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
// const graphqlUtils = require('graphql/utilities');

const createNetworkInterface = ApolloClient.createNetworkInterface;
const networkInterface = createNetworkInterface({
  uri: `http://localhost:${config.server.port}/graphql`
});
networkInterface.use([{
  applyMiddleware(req, next) {
    next();
  }
}]);
const client = new ApolloClient.ApolloClient({
  networkInterface,
  addTypename: true
});

const app = new Koa();
const router = new KoaRouter();

// koaBody is needed just for POST.
app.use(koaBody());

module.exports = async function start() {
  /* console.log('///', graphql.introspectionQuery);
  const response = await client.query({query: gql`${graphql.introspectionQuery}`});
  console.log('_____________________________', response.data.__schema);
  const clientSchema = graphql.buildClientSchema(response.data);
  console.log('----------------------', clientSchema)
  console.log('=================', graphql.printType(clientSchema.getTypeMap()['User']))
  const typeDef = graphqlUtils.printIntrospectionSchema(clientSchema);
  console.log('...............', typeDef);
  const typeInfo = new graphql.TypeInfo(clientSchema);
  console.log('****************', typeInfo); */
  const introspectionResponse = await client.query({query: gql`${graphql.introspectionQuery}`});
  const clientSchema = graphql.buildClientSchema(introspectionResponse.data);
  const typeMap = clientSchema.getTypeMap();
  const typeDefs = Object.keys(typeMap)
    .map((key) => {
      const type = typeMap[key];
      return /^__/.test(type.name) || ['ID', 'String', 'Int', 'Float', 'Boolean'].includes(type.name)
        ? null
        : graphql.printType(type);
    })
    .filter(type => type);
  console.log('...............', typeDefs);

  const schema = makeExecutableSchema({
    typeDefs,
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

          console.log('... Forwarded query user ...');
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
