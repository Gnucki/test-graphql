'use strict';

const Koa = require('koa'); // koa@2
const KoaRouter = require('koa-router'); // koa-router@next
const koaBody = require('koa-bodyparser'); // koa-bodyparser@next
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;
const config = require('./config');

const app = new Koa();
const router = new KoaRouter();

// koaBody is needed just for POST.
app.use(koaBody());

const users = {
  bobby: {
    name: 'Bobby'
  },
  tom: {
    name: 'Tom'
  }
};

const schema = makeExecutableSchema({
  typeDefs: [
    `type Query {
      user(id: String): User
    }`,
    `type User {
      id: ID
      name: String
    }`,
    `schema {
        query: Query
    }`
  ],
  resolvers: {
    Query: {
      user(obj, args, context/* , info */) {
        console.log('... Query user ...');
        console.log('obj:', obj);
        console.log('args:', args);
        console.log('context:', context);
        // console.log('info:', info);
        return users[args.id];
      }
    }
  }
});

router.post('/graphql', graphqlKoa({schema}));
router.get('/graphql', graphqlKoa({schema}));

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(config.server.port);

console.log(`Server listening on port ${config.server.port}.`);
