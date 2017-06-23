'use strict';

require('isomorphic-fetch');
const ApolloClient = require('apollo-client');
const gql = require('graphql-tag');
const config = require('./config');

const createNetworkInterface = ApolloClient.createNetworkInterface;
const client = new ApolloClient.ApolloClient({
  networkInterface: createNetworkInterface({
    uri: `http://localhost:${config.proxy.port}/graphql`
  })
});

client.query({
  query: gql`
    query GetUser {
      user(id: "tom") {
        name
        comments
        preference(key: "autolog", plop: 3) {
          value
        }
        preferences {
          key
          value
        }
      }
    }
  `
})
  .then(data => console.log('user:', data.data.user))
  .catch(error => console.error(error));

// https://github.com/graphql/graphql-js/blob/master/src/type/introspection.js
client.query({
  query: gql`
{
  __schema {
    types {
      name
    }
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
    directives {
      name
    }
  }
}
  `
})
  .then(data => console.log('types:', data.data.__schema)) // eslint-disable-line
  .catch(error => console.error(error));
