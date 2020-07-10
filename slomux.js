// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение
const createStore = (reducer, initialState) => {
    let currentState = initialState
    const listeners = []
  
    const getState = () => currentState
    const dispatch = (action) => {
      currentState = reducer(currentState, action)
      listeners.forEach((listener) => listener())
    }
  
    const subscribe = (listener) => listeners.push(listener)
  
    return { getState, dispatch, subscribe }
  }
  
  const connect = (mapStateToProps, mapDispatchToProps) => (Component) => {
    class WrappedComponent extends React.Component {
      render() {
        return (
          <Component
            {...this.props}
            {...mapStateToProps(this.context.store.getState(), this.props)}
            {...mapDispatchToProps(this.context.store.dispatch, this.props)}
          />
        )
      }
  
      componentDidMount() {
        //componentDidUpdate вызывал всякий раз forceUpdate,
        //тем самым стор постоянно возвращался с init state
        this.context.store.subscribe(this.handleChange)
      }
  
      handleChange = () => {
        this.forceUpdate()
      }
    }
  
    WrappedComponent.contextTypes = {
      store: PropTypes.object,
    }
  
    return WrappedComponent
  }
  
  class Provider extends React.Component {
    getChildContext() {
      return {
        store: this.props.store,
      }
    }
  
    render() {
      return React.Children.only(this.props.children)
    }
  }
  
  Provider.childContextTypes = {
    store: PropTypes.object,
  }
  
  // APP
  
  // actions
  const CHANGE_INTERVAL = 'CHANGE_INTERVAL'
  
  // action creators
  const changeInterval = (value) => ({
    type: CHANGE_INTERVAL,
    payload: value,
  })
  
  // reducers
  //в редьюсере не было default arg (state)
  //переписал на иммутабельный редьюсер
  //default in switch возвращал пустой объект, а не init state
  const reducer = (
    state = {
      currentInterval: 0,
    },
    action
  ) => {
    switch (action.type) {
      case CHANGE_INTERVAL:
        const currentInterval =
          state.currentInterval + action.payload >= 0
            ? state.currentInterval + action.payload
            : state.currentInterval
        return {
          ...state,
          currentInterval,
        }
      default:
        return state
    }
  }
  
  // components
  
  class IntervalComponent extends React.Component {
    render() {
      return (
        <div>
          <span>
            Интервал обновления секундомера: {this.props.currentInterval} сек.
          </span>
          <span>
            <button onClick={() => this.props.changeInterval(-1)}>-</button>
            <button onClick={() => this.props.changeInterval(1)}>+</button>
          </span>
        </div>
      )
    }
  }
  
  const Interval = connect(
    (state) => ({
      currentInterval: state.currentInterval,
    }),
    (dispatch) => ({
      changeInterval: (value) => dispatch(changeInterval(value)),
    })
  )(IntervalComponent)
  
  class TimerComponent extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        currentTime: 0,
      }
      this.handleStart = this.handleStart.bind(this)
      this.handleStop = this.handleStop.bind(this)
    }
    render() {
      console.log(this.props.currentInterval)
      return (
        <div>
          <Interval />
          <div>Секундомер: {this.state.currentTime} сек.</div>
          <div>
            <button onClick={this.handleStart}>Старт</button>
            <button onClick={this.handleStop}>Стоп</button>
          </div>
        </div>
      )
    }
    handleStart() {
      //this необходимо забиндить к классу, иначе контекст теряется,
      //все методы внутри класса для безопасности использования необходимо биндить в конструкторе
      //interval не может быть равен 0 так как это приведёт к перегрузке
      if (this.props.currentInterval > 0) {
        const interval = this.props.currentInterval * 1000
        this.handleInterval = setInterval(
          () =>
            this.setState({
              currentTime: this.state.currentTime + 1,
            }),
          interval
        )
      }
    }
  
    handleStop() {
      //не было очистки интервала, не было интервала, стоял таймаут
      this.setState({ currentTime: 0 })
      clearInterval(this.handleInterval)
    }
  }
  
  const Timer = connect(
    (state) => ({
      currentInterval: state.currentInterval,
    }),
    () => {}
  )(TimerComponent)
  
  // init
  // не было init State
  const initState = {
    currentInterval: 0,
  }
  ReactDOM.render(
    <Provider store={createStore(reducer, initState)}>
      <Timer />
    </Provider>,
    document.getElementById('app')
  )