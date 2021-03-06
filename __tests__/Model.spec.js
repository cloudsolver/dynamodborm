import { DataMapper } from '@aws/dynamodb-data-mapper'
import Client from 'aws-sdk/clients/dynamodb'
import v4 from 'uuid/v4'
import buildAggregatorModel from '../src/Model'
import Connection from '../src/Connection'

const region = 'us-east-1'
const client = new Client({ region })
const mapper = new DataMapper({ client })
const connection = new Connection({ region })
const schema = Joi => ({
  id: {
    type: 'String',
    keyType: 'HASH',
    defaultProvider: v4,
    validator: Joi.any()
  },
  parent: {
    type: 'String',
    validator: Joi.string()
  },
  name: {
    type: 'String',
    validator: Joi.any()
  },
  email: {
    type: 'String',
    validator: Joi.any()
  },
  cpf: {
    type: 'Number',
    validator: Joi.any()
  }
})

const tableName = 'accounts'

describe('Model', () => {
  it('Model should not be able to use a mapper method', async (done) => {
    expect.assertions(1)
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    const account = new Account({ name: 'teste' })
    const fnFail = () => mapper.update({ item: account }, { onMissing: 'skip' })
    try {
      await fnFail()
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
    return done()
  })

  it('Model should be able to use a mapper method', async (done) => {
    expect.assertions(1)
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema,
      tableName
    })
    const account = new Account({ name: 'teste' })
    const result = await mapper.update({ item: account }, { onMissing: 'skip' })
    expect(result).toHaveProperty('id')
    return done()
  })

  it('root Model should be a construct alias for Model Root Class method', async (done) => {
    expect.assertions(1)
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }

    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema,
      tableName
    })
    const account = new root.Model({ name: 'teste' })
    const result = await mapper.update({ item: account }, { onMissing: 'skip' })
    expect(result).toHaveProperty('id')
    return done()
  })

  it('root Alias should be a construct alias for Model Root Class method', async (done) => {
    expect.assertions(1)
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema,
      tableName
    })
    const account = new root.Account({ name: 'teste' })
    const result = await mapper.update({ item: account }, { onMissing: 'skip' })
    expect(result).toHaveProperty('id')
    return done()
  })

  it('Model should be able to validate it-self - in error', (done) => {
    expect.assertions(1)
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema,
      tableName
    })
    const account = new root.Account({ name: 'teste', parent: 1 })
    return account.validate()
      .then(valid => console.log(valid))
      .catch(err => (expect(err).toBeDefined()), done())
  })

  it('Model should be able to validate it-self - in success', (done) => {
    expect.assertions(1)
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema,
      tableName
    })
    const account = new root.Account({ name: 'teste', parent: 'dsa' })
    return account.validate()
      .then(valid => (expect(valid).toBeDefined(), done()))
      .catch(err => console.log(err))
  })

  it('Model should be able to validade a uuid', (done) => {
    expect.assertions(1)
    const schemaId = hasToBe => ({
      id: {
        type: 'String',
        keyType: 'HASH',
        defaultProvider: v4,
        validator: hasToBe.string().guid()
      },
      parent: {
        type: 'String',
        validator: hasToBe.string()
      },
      name: {
        type: 'String',
        validator: hasToBe.string()
          .alphanum()
          .min(3)
          .max(50)
          .required()
      }
    })
    const root = {}
    class Account {
      constructor(values = {}) {
        Object.assign(this, values)
      }
    }
    buildAggregatorModel(connection, root, {
      ModelClass: Account,
      className: 'Account',
      schema: schemaId,
      tableName
    })
    const account = new root.Account({ name: 'teste', parent: 'dsa' })
    return account.save().then(saved =>
      saved.validate().then(valid => (
        expect(valid).toBeDefined(),
        done()
      )).catch(err => console.log(err)))
  })
})
