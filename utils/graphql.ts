var { buildSchema } = require('graphql');

export var schema = buildSchema(`
  type Profile {
    text: String
  }
`);

// The root provides a resolver function for each API endpoint
export var root = {
  profile: () => {
    return 'Hello world!';
  },
};
