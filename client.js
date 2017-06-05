'use strict';

require('isomorphic-fetch');
const ApolloClient = require('apollo-client');
const gql = require('graphql-tag');

const port = 3001;
const createNetworkInterface = ApolloClient.createNetworkInterface;
const client = new ApolloClient.ApolloClient({
  networkInterface: createNetworkInterface({
    uri: `http://localhost:${port}/graphql`
  })
});

client.query({
  query: gql`
    query GetUser {
      user(id:"tom") {
        name
      }
    }
  `
})
  .then(data => console.log(data))
  .catch(error => console.error(error));
