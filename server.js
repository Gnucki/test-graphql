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
    id: 1,
    name: 'Bobby',
    comments: [
      'oh my god!'
    ],
    foo: 'bar'
  },
  tom: {
    id: 2,
    name: 'Tom',
    comments: [
      'hey Bob!',
      'this is not my war.'
    ],
    foo: 'bar'
  }
};

const preferences = [
  {
    id: 3,
    user: 1,
    key: 'rememberme',
    value: true
  },
  {
    id: 4,
    user: 1,
    key: 'rememberme',
    value: true
  },
  {
    id: 5,
    user: 2,
    key: 'autolog',
    value: true
  },
  {
    id: 6,
    user: 2,
    key: 'autolog',
    value: true
  }
];

const schema = makeExecutableSchema({
  typeDefs: [
    `type Query {
      user(id: String): User
    }`,
    `type User {
      id: ID
      name: String
      comments: [String]
      foo: String
      preference(key: String!, plop: Int): Preference
      preferences: [Preference]
    }`,
    `type Preference {
      id: ID
      user: User
      key: String
      value: Boolean
    }`,
    `schema {
      query: Query
    }
    enum Episode {
      NEWHOPE
      EMPIRE
      JEDI
    }
    interface Character {
      id: ID!
      name: String!
      friends: [Character]
      appearsIn: [Episode]!
    }
    type Human implements Character {
      id: ID!
      name: String!
      friends: [Character]
      appearsIn: [Episode]!
      totalCredits: Int
    }
    type Droid implements Character {
      id: ID!
      name: String!
      friends: [Character]
      appearsIn: [Episode]!
      primaryFunction: String
    }
    union SearchResult = Human | Droid
    input ReviewInput {
      stars: Int!
      commentary: String
    }`
  ],
  resolvers: {
    Query: {
      user(obj, args, context/* , info */) {
        console.log('... Query user ...');
        console.log('args:', args);
        console.log('context:', context);
        // console.log('info:', info);
        return users[args.id];
      }
    },
    User: {
      preference(user, args, context) {
        console.log('... User preference ...');
        console.log('user:', user);
        console.log('args:', args);
        console.log('context:', context);

        return preferences.find(
          preference => preference.user === user.id && preference.key === args.key
        );
      },
      preferences(user, args, context) {
        console.log('... User preferences ...');
        console.log('user:', user);
        console.log('args:', args);
        console.log('context:', context);

        return preferences.filter(preference => preference.user === user.id);
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
