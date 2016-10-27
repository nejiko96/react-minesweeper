import React, {Component} from 'react';
import ReactDOM from 'react-dom';

const cellSize = 32;
const cellPx = `${cellSize}px`;
const cellImg = `url('images/green_${cellSize}x${cellSize}.png')`;

const textBoxStyle = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #d3d3d3',
  display: 'inline-block',
  paddingRight: '2px',
  textAlign: 'right',
  width: '40px'
};

const cellStyleBase = {
  backgroundImage: cellImg,
  display: 'inline-block',
  height: cellPx,
  overflow: 'hidden',
  width: cellPx
};

const cellStyle = (left, top) => {
  const x = -cellSize * left;
  const y = -cellSize * top;
  const position = {backgroundPosition: `${x}px ${y}px`};
  return Object.assign({}, cellStyleBase, position);
};

const styles = {
  remain: textBoxStyle,
  timer: textBoxStyle,
  cells: {
    lineHeight: 0
  },
  cell: {
    '01': cellStyle(0, 0),
    '0f': cellStyle(1, 0),
    '0h': cellStyle(2, 0),
    '10': cellStyle(0, 1),
    '11': cellStyle(1, 1),
    '12': cellStyle(2, 1),
    '13': cellStyle(0, 2),
    '14': cellStyle(1, 2),
    '15': cellStyle(2, 2),
    '16': cellStyle(0, 3),
    '17': cellStyle(1, 3),
    '18': cellStyle(2, 3),
    '19': cellStyle(0, 4),
    '1a': cellStyle(1, 4),
    '1b': cellStyle(2, 4)
  },
  restart: {}
};

const utils = {
  getProperty: (value, opt) => value ? Math.min(Math.max(value, opt.min), opt.max) : opt.default,
  fillArray2D: (w, h, value) => Array.apply(null, Array(h)).map(() => Array(w).fill(value)),
  noop: () => {},
  addEventListener: (cmp, event, fn) => {
    ReactDOM.findDOMNode(cmp).addEventListener(event, fn);
  },
  removeEventListener: (cmp, fn) => {
    ReactDOM.findDOMNode(cmp).removeEventListener(event, fn);
  }
};

class Remain extends Component {
  render() {
    return (
      <span style={styles.remain} >{this.props.value}</span>
    );
  }
}

Remain.propTypes = {
  value: React.PropTypes.number
};

class Timer extends Component {
  static get powers() {
    return {
      ms: 1,
      s: 1000
    };
  }
  timeParse(value) {
    const result = /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/.exec(value.trim());
    const num = result[1] && parseFloat(result[1]) || 1000;
    const mult = result[2] && Timer.powers[result[2]] || 1;
    return num * mult;
  }
  start() {
    this.setState({count: 0});
    this.intervalID = setInterval(this.update, this.timeParse(this.props.interval));
  }
  update() {
    this.setState({count: this.state.count + 1});
    if (this.props.limit > 0 && this.state.count >= this.props.limit) {
      this.stop();
    }
  }
  stop() {
    clearInterval(this.intervalID);
    this.intervalID = null;
  }
  constructor(props) {
    super(props);
    this.state = {count: 0};
    this.intervalID = null;
    // event binding
    this.timeParse = this.timeParse.bind(this);
    this.start = this.start.bind(this);
    this.update = this.update.bind(this);
    this.stop = this.stop.bind(this);
  }
  componentDidMount() {
    this.props.running && this.start();
  }
  componentWillUnmount() {
    this.props.running && this.intervalID && this.stop();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.running !== nextProps.running) {
      nextProps.running ? this.start() : this.stop();
    }
  }
  render() {
    return (
      <span style={styles.timer} >{this.state.count}</span>
    );
  }
}

Timer.propTypes = {
  interval: React.PropTypes.string.isRequired,
  limit: React.PropTypes.number,
  running: React.PropTypes.bool.isRequired
};

class Listener {
  static get event() {
    return {
      mouseDown: 0,
      mouseUp: 1,
      mouseOver: 2,
      mouseOut: 3
    };
  }
  static get button() {
    return {
      left: 1,
      right: 2,
      both: 3
    };
  }
  constructor(target) {
    this.pressed = 0;
    this.callbacks = [
      [
        target.handleLeftMouseDown,
        target.handleRightMouseDown,
        target.handleBothMouseDown,
      ],
      [
        target.handleLeftMouseUp,
        target.handleRightMouseUp,
        target.handleBothMouseUp,
      ],
      [
        target.handleLeftMouseOver,
        target.handleRightMouseOver,
        target.handleBothMouseOver,
      ],
      [
        target.handleLeftMouseOut,
        target.handleRightMouseOut,
        target.handleBothMouseOut,
      ]
    ];
  }
  handleMouseDown(ev, i, j) {
    this.pressed |= {
      0: Listener.button.left,
      2: Listener.button.right
    }[ev.button];
    this.triggerCallback(
      Listener.event.mouseDown,
      this.pressed,
      i, j
    );
  }
  handleMouseUp(i, j) {
    if (this.pressed === 0) {
      return;
    }
    const pressed = this.pressed;
    this.pressed = 0;
    this.triggerCallback(
      Listener.event.mouseUp,
      pressed,
      i, j
    );
  }
  handleMouseOver(i, j) {
    if (this.pressed === 0) {
      return;
    }
    this.triggerCallback(
      Listener.event.mouseOver,
      this.pressed,
      i, j
    );
  }
  handleMouseOut(i, j) {
    if (this.pressed === 0) {
      return;
    }
    this.triggerCallback(
      Listener.event.mouseOut,
      this.pressed,
      i, j
    );
  }
  triggerCallback(e, b, i, j) {
    const cb = this.callbacks[e][b - 1];
    cb && cb(i, j);
  }
}

Listener.noop = {
  handleMouseDown: utils.noop,
  handleMouseUp: utils.noop,
  handleMouseOver: utils.noop,
  handleMouseOut: utils.noop
}

class Board extends Component {
  static get cellTypes() {
    return {
      hidden: '0',
      notMarked: '01',
      flagged: '0f',
      uncertain: '0h',
      open: '1',
      vacant: '10',
      mine: '09',
      explosion: '1a',
      mistake: '1b'
    };
  }
  static get flagTypes() {
    return {
      hasMine: 1,
      hasFlag: 2
    };
  }
  init(props) {
    const w = props.width;
    const h = props.height;
    return {
      remain: props.mines,
      cells: utils.fillArray2D(w, h, Board.cellTypes.notMarked),
      flags: utils.fillArray2D(w, h, 0)
    };
    return Object.assign({}, size, other);
  }
  startGame() {
    this.props.onStart();
  }
  stopGame() {
    this.listener = Listener.noop;
    this.props.onStop();
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.startGame.bind(this);
    // this.handleMouseDown = this.handleMouseDown.bind(this);
    // this.handleMouseUp = this.handleMouseUp.bind(this);
    // this.handleMouseOver = this.handleMouseOver.bind(this);
    // this.handleMouseOut = this.handleMouseOut.bind(this);
  }
  componentDidMount() {
    this.listener = new Listener(this);
  }
  render() {
    const boardNodes = this.state.cells.map((row, i) => {
      const rowNodes = row.map((cell, j) => {
        const key = `${i}_${j}`;
        return (
          <span
            key={key}
            style={styles.cell[cell]}
            onMouseDown={(ev) => this.listener.handleMouseDown(ev, i, j)}
            onMouseUp={() => this.listener.handleMouseUp(i, j)}
            onMouseOver={() => this.listener.handleMouseOver(i, j)}
            onMouseOut={() => this.listener.handleMouseOut(i, j)}
            />);
      });
      rowNodes.push(<br/>);
      return rowNodes;
    });
    return (
      <div style={styles.cells}>
        {boardNodes}
      </div>
    );
  }
  handleLeftMouseDown(i, j) {
    console.log(`LeftMouseDown(${i}, ${j})`);
  }
  handleLeftMouseUp(i, j) {
    console.log(`LeftMouseUp(${i}, ${j})`);
  }
  handleRightMouseDown(i, j) {
    console.log(`RightMouseDown(${i}, ${j})`);
  }
  handleRightMouseUp(i, j) {
    console.log(`RightMouseUp(${i}, ${j})`);
  }
  handleBothMouseDown(i, j) {
    console.log(`BothMouseDown(${i}, ${j})`);
  }
  handleBothMouseUp(i, j) {
    console.log(`BothMouseUp(${i}, ${j})`);
  }}

Board.propTypes = {
  gameId: React.PropTypes.number.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  mines: React.PropTypes.number.isRequired,
  onStart: React.PropTypes.func,
  onStop: React.PropTypes.func,
  onRemainChange: React.PropTypes.func
};

export class Minesweeper extends Component {
  static get settings() {
    return {
      levels: {
        easy: {
          width: 9,
          height: 9,
          mines: 10
        },
        medium: {
          width: 16,
          height: 16,
          mines: 40
        },
        hard: {
          width: 30,
          height: 16,
          mines: 99
        }
      },
      width: {
        min: 9,
        max: 30,
        default: 9
      },
      height: {
        min: 9,
        max: 24,
        default: 9
      },
      mines: n => {
        const pct = 10 + Math.floor(n / 45);
        return {
          min: 10,
          max: Math.floor(n * 0.94 - 8.45),
          default: Math.round(n * pct / 1000) * 10
        };
      }
    };
  }
  defaultSize(level) {
    return Minesweeper.settings.levels[level || 'easy'];
  }
  customSize(props) {
    const w = utils.getProperty(props.width, Minesweeper.settings.width);
    const h = utils.getProperty(props.height, Minesweeper.settings.height);
    const m = utils.getProperty(props.mines, Minesweeper.settings.mines(w * h));
    return {
      width: w,
      height: h,
      mines: m
    };
  }
  init(props) {
    const size = this.defaultSize(props.level) || this.customSize(props);
    const other = {
      gameId: 1,
      running: false,
      remain: size.mines
    };
    return Object.assign({}, size, other);
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.handleStart = this.handleStart.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.handleBoardChange = this.handleBoardChange.bind(this);
    this.handleRetry = this.handleRetry.bind(this);
  }
  componentDidMount() {
    utils.addEventListener(this, 'contextmenu', this.handleContextMenu);
    utils.addEventListener(this, 'selectstart', this.handleSelectStart);
  }
  componentWillUnmount() {
    utils.removeEventListener(this, 'contextmenu', this.handleContextMenu);
    utils.removeEventListener(this, 'selectstart', this.handleSelectStart);
  }
  render() {
    return (
      <div>
        <form>
          <nobr>
            <Remain value={this.state.remain}/>mines
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            time : <Timer interval="1s" limit={999} running={this.state.running}/>
            <Board
              gameId={this.state.gameId}
              width={this.state.width}
              height={this.state.height}
              mines={this.state.mines}
              onStart={this.handleStart}
              onStop={this.handleStop}
              onChange={this.handleBoardChange}
              />
            <button
              type="button"
              style={styles.restart}
              onClick={this.handleRetry}
              >Retry</button>
          </nobr>
        </form>
      </div>
    );
  }
  handleStart() {
    this.setState({running: true});
  }
  handleStop() {
    this.setState({running: false});
  }
  handleBoardChange(value) {
    this.setState({remain: value});
  }
  handleRetry() {
    this.setState({gameId: this.state.gameId + 1});
  }
  handleContextMenu(e) {
    e.preventDefault();
  }
  handleSelectStart(e) {
    e.preventDefault();
  }
}

Minesweeper.propTypes = {
  level: React.PropTypes.string,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  mines: React.PropTypes.number
};
