import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { curry } from '../utils/func'
import shallowEqual from '../utils/shallowEqual'
import List from './List'
import Form from './Form'

const types = {
  form: Form,
  list: List,
}

export default curry((options, Origin) => {
  const {
    type = 'list', key = 'value', limit = 0, bindProps = [],
  } = options || {}
  const Datum = types[type]

  return class extends PureComponent {
    static propTypes = {
      onChange: PropTypes.func,
      onDatumBind: PropTypes.func,
      datum: PropTypes.object,
      value: PropTypes.any,
    }

    constructor(props) {
      super(props)
      const { datum, onChange } = props
      const value = props[key]

      if (datum instanceof Datum) {
        this.datum = datum
      } else {
        const ops = bindProps.reduce((o, k) => {
          o[k] = props[k]
          return o
        }, { value, limit })
        this.datum = new Datum(Object.assign(ops, datum))
      }

      if (onChange) {
        this.datum.onChange = onChange
      }
    }

    componentDidMount() {
      this.prevValues = this.props[key]
    }

    componentDidUpdate() {
      const values = this.props[key]
      if (!shallowEqual(values, this.prevValues)) {
        this.datum.setValue(values)
        this.prevValues = values
      }
    }

    render() {
      const { onDatumBind, ...props } = this.props
      if (onDatumBind) onDatumBind(this.datum)
      if (options.bindProps && options.bindProps.includes('disabled') && props.disabled !== undefined) {
        this.datum.setDisabled(props.disabled)
      }

      return (
        <Origin
          {...props}
          datum={this.datum}
        />
      )
    }
  }
})
