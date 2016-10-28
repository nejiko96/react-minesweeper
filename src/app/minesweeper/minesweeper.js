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
  cell: Array.apply(null, Array(15)).map((v, i) => cellStyle(i % 3, i / 3)),
  restart: {}
};

const utils = {
  getProperty: (value, opt) => value ? Math.min(Math.max(value, opt.min), opt.max) : opt.default,
  fillArray2D: (w, h, fn) => Array.apply(null, Array(h)).map(
    (_, i) => Array.apply(null, Array(w)).map(
      (_, j) => fn(i, j)
    )
  ),
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
  static get status() {
    return {
      notStarted: 0,
      running: 1,
      stopped: 2
    };
  }
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
  reset() {
    this.stop();
    this.setState({count: 0});
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
    this.reset = this.reset.bind(this);
  }
  componentDidMount() {
    this.props.running && this.start();
  }
  componentWillUnmount() {
    this.props.running && this.intervalID && this.stop();
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.status !== nextProps.status) {
      switch (nextProps.status) {
        case Timer.status.notStarted:
          this.reset();
          break;
        case Timer.status.running:
          this.start();
          break;
        case Timer.status.stopped:
          this.stop();
          break;
      }
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
  status: React.PropTypes.number.isRequired
};

Timer.defaultProps = {limit: 0};

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

class CellState {
  constructor() {
    this.flags = Cell.f.hidden;
    this.subFlags = 0;
  }
  press() {
    this.subFlags |= Cell.sf.pressed;
  }
  release() {
    this.subFlags &= ~Cell.sf.pressed;
  }
  open(byClick) {
    // already open
    if (!(this.flags & Cell.f.hidden)) {
      return 0;
    }
    // marked & click open
    if (this.flags & Cell.f.marked && byClick) {
      return 0;
    }
    // open
    this.flags &= ~Cell.f.hidden;
    // if mine exists
    if (this.flags & Cell.f.mine) {
      // explode on click open
      if (byClick) { this.subFlag |= Cell.sf.explode }
      return 2;
    }
    return 1;
  }
}

class Cell extends Component {
  static get f() {
    return {
      hidden: 1,
      mine: 2,
      marked: 4,
    };
  }
  static get sf() {
    return {
      hint: 15,
      pending: 16,
      explode: 32,
      pressed: 64
    };
  }
  static get style() {
    return {
      hidden: 0,
      marked: 1,
      pending: 2,
      pressed: 3,
      open: 3,
      mine: 12,
      explosion: 13,
      mistake: 14
    };
  }
  styleNo() {
    const flags = this.props.flags;
    const subFlags = this.props.subFlags;
    if (flags === Cell.f.marked) {
      return Cell.style.mistake;
    }
    if (flags & Cell.f.marked) {
      return Cell.style.marked;
    }
    if (flags & Cell.f.hidden) {
      if (subFlags & Cell.sf.pressed) {
        return Cell.style.pressed;
      }
      if (subFlags & Cell.sf.pending) {
        return Cell.style.pending;
      }
      return Cell.style.hidden;
    }
    if (flags & Cell.f.mine) {
      return subFlags & Cell.sf.explode ? Cell.style.explosion : Cell.style.mine;
    }
    return Cell.style.open + (subFlags & Cell.sf.hint);
  }
  constructor(props) {
    super(props);
    this.styleNo = this.styleNo.bind(this);
  }
  render() {
    return (
      <span
        style={styles.cell[this.styleNo()]}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        />);
  }
}

Cell.propTypes = {
  flags: React.PropTypes.number.isRequired,
  subFlags: React.PropTypes.number.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  onMouseUp: React.PropTypes.func.isRequired,
  onMouseOver: React.PropTypes.func.isRequired,
  onMouseOut: React.PropTypes.func.isRequired
};

class Board extends Component {
  init(props) {
    return {
      cells: utils.fillArray2D(props.width, props.height, () => new CellState()),
      minePos: [],
      markPos: []
    };
  }
  startGame(i, j) {
    this.setState({minePos: this.generateMine(i, j)});
    this.props.onStart();
  }
  stopGame() {
    this.listener = Listener.noop;
    this.props.onStop();
  }
  resetGame() {
    this.setState(this.init(this.props));
    this.listener = new Listener(this);
  }
  generateMine(i, j) {
    return [[0, 0]];
  }
  open(i, j, byClick) {
    const result = this.state.cells[i][j].open(byClick);
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.startGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.generateMine = this.generateMine.bind(this);
    this.open = this.open.bind(this);
    this.handleLeftMouseDown = this.handleLeftMouseDown.bind(this);
    this.handleLeftMouseUp = this.handleLeftMouseUp.bind(this);
    this.handleLeftMouseOver = this.handleLeftMouseOver.bind(this);
    this.handleLeftMouseOut = this.handleLeftMouseOut.bind(this);
  }
  componentDidMount() {
    this.listener = new Listener(this);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.gameId !== nextProps.gameId) {
      this.resetGame();
    }
  }
  render() {
    const boardNodes = this.state.cells.map((row, i) => {
      const rowNodes = row.map((cell, j) => {
        const key = `${i}_${j}`;
        return (
          <Cell
            key={key}
            flags={cell.flags}
            subFlags={cell.subFlags}
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
    this.state.cells[i][j].press();
    this.setState({cells: this.state.cells});
  }
  handleLeftMouseOver(i, j) {
    console.log(`LeftMouseOver(${i}, ${j})`);
    this.state.cells[i][j].press();
    this.setState({cells: this.state.cells});
  }
  handleLeftMouseOut(i, j) {
    this.state.cells[i][j].release();
    this.setState({cells: this.state.cells});
  }
  handleLeftMouseUp(i, j) {
    this.state.cells[i][j].release();
    if (this.state.minePos.length === 0) {
      this.startGame(i, j);
    }
    this.open(i, j, true);
    this.setState({cells: this.state.cells});
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
    return Minesweeper.settings.levels[level];
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
      timerStatus: Timer.status.notStarted,
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
            time : <Timer interval="1s" limit={999} status={this.state.timerStatus}/>
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
    this.setState({timerStatus: Timer.status.running});
  }
  handleStop() {
    this.setState({timerStatus: Timer.status.stopped});
  }
  handleBoardChange(board) {
    this.setState({remain: board.state.mines - board.state.markPos.length});
  }
  handleRetry() {
    this.setState({
      gameId: this.state.gameId + 1,
      timerStatus: Timer.status.notStarted,
      remain: this.state.mines
    });
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

Minesweeper.defaultProps = {level: 'easy'};
