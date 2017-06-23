# test-graphql
Test repository for GraphQL.

## Use
Start the server
```sh
$ npm start
```

Start a client
```sh
$ npm start client
```

## Spec

const proxy = new AgraphProxy();
proxy.addEndpoint(uri, options); // {namespace: ""}
proxy.addType(`Message {
  author: User
}`);
