import { substitute } from '../strings'
import Datum from '../../Datum'
import { wrapFormError } from '../../utils/errors'
import range from './range'
import rangeLength from './rangeLength'
import required from './required'
import typeOf from './type'
import regTest from './regExp'

function getRule(rules, inputType) {
  if (typeof rules === 'function') return rules

  const {
    type = inputType, message, regExp, ...other
  } = rules
  other.message = substitute(message, other)

  if (other.required) return required(other)

  if (regExp) return regTest(regExp, other)

  if (other.min !== undefined || other.max !== undefined) {
    if (type === 'number' || type === 'integer') {
      return range(other)
    }
    return rangeLength(other)
  }

  if (type) return typeOf(type, other.message)

  const err = new Error(`Rule ${JSON.stringify(rules)} is not valid.`)
  console.error(err)
  throw err
}

const validate = (value, formdata, rules, type) => new Promise((resolve, reject) => {
  const $rules = [...rules]
  const rule = $rules.shift()
  if (!rule) {
    resolve(true)
    return
  }

  const callback = (result) => {
    if (result !== true) {
      reject(wrapFormError(result))
      return
    }

    validate(value, formdata, $rules, type).then(resolve, reject)
  }

  const fn = getRule(rule, type)
  let val = value
  if (fn === rule && (value instanceof Datum.List || value instanceof Datum.Form)) {
    val = value.getValue()
  }
  const cb = fn(val, formdata, callback)
  if (cb && cb.then) {
    cb.then(callback.bind(null, true)).catch((e) => {
      reject(wrapFormError(e))
    })
  }
})

export default validate

