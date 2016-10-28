import React, {Component} from 'react';
import ReactDOM from 'react-dom';

const utils = {
  fillArray: (n, fn) => Array.apply(null, Array(n)).map((_, i) => fn(i)),
  fillArray2D: (w, h, fn) => Array.apply(null, Array(h)).map(
    (_, i) => Array.apply(null, Array(w)).map(
      (_, j) => fn(i, j)
    )
  ),
  getProperty: (value, opt) => value ? Math.min(Math.max(value, opt.min), opt.max) : opt.default,
  noop: () => {},
  addEventListener: (cmp, event, fn) => {
    ReactDOM.findDOMNode(cmp).addEventListener(event, fn);
  },
  removeEventListener: (cmp, fn) => {
    ReactDOM.findDOMNode(cmp).removeEventListener(event, fn);
  }
};

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
  cell: utils.fillArray(15, i => cellStyle(i % 3, Math.floor(i / 3))),
  restart: {}
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
    this.props.status === Timer.status.running && this.start();
  }
  componentWillUnmount() {
    this.intervalID && this.stop();
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
      exploded: 32,
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
  static get result() {
    return {
      none: 0,
      opened: 1,
      exploded: 2,
      marked: 3,
      unmarked: 4,
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
      return subFlags & Cell.sf.exploded ? Cell.style.explosion : Cell.style.mine;
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
    // already opened
    if (!(this.flags & Cell.f.hidden)) {
      return Cell.result.none;
    }
    // click on marked
    if (this.flags & Cell.f.marked && byClick) {
      return Cell.result.none;
    }
    // open
    this.flags &= ~Cell.f.hidden;
    // if mine exists
    if (this.flags & Cell.f.mine) {
      // explode if click open
      if (byClick) { this.subFlag |= Cell.sf.exploded }
      return Cell.result.exploded;
    }
    return Cell.result.opened;
  }
  toggleMarked() {
    // already opened
    if (!(this.flags & Cell.f.hidden)) {
      return Cell.result.none;
    }
    if (this.flags & Cell.f.marked) {
      // marked -> pending
      this.flags &= ~Cell.f.marked;
      this.subFlags |= Cell.sf.pending;
      return Cell.result.unmarked;
    }
    if (this.subFlags & Cell.sf.pending) {
      // pending -> not marked
      this.subFlags &= ~Cell.sf.pending;
      return Cell.result.none;
    }
    // not marked -> marked
    this.flags |= Cell.f.marked;
    return Cell.result.marked;
  }
}

class Board extends Component {
  init(props) {
    return {
      cells: utils.fillArray2D(props.width, props.height, () => new CellState()),
      minePos: new Set(),
      markPos: new Set()
    };
  }
  startGame(i, j) {
    this.setState({minePos: this.generateMines(i, j)});
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
  generateMines(i, j) {
    return new Set([0, 0].toString());
  }
  open(i, j, byClick) {
    const result = this.state.cells[i][j].open(byClick);
  }
  toggleMarked(i, j) {
    const result = this.state.cells[i][j].toggleMarked();
    if (result == Cell.result.none) {
      return;
    }
    switch (result) {
      case Cell.result.marked:
        this.state.markPos.add([i, j].toString());
        break;
      case Cell.result.unmarked:
        this.state.markPos.delete([i, j].toString());
        break;
    }
    this.props.onChange(this.state);
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.startGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.generateMines = this.generateMines.bind(this);
    this.open = this.open.bind(this);
    this.toggleMarked = this.toggleMarked.bind(this);
    this.handleLeftMouseDown = this.handleLeftMouseDown.bind(this);
    this.handleLeftMouseUp = this.handleLeftMouseUp.bind(this);
    this.handleLeftMouseOver = this.handleLeftMouseOver.bind(this);
    this.handleLeftMouseOut = this.handleLeftMouseOut.bind(this);
    this.handleRightMouseDown = this.handleRightMouseDown.bind(this);
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
    if (this.state.minePos.size === 0) {
      this.startGame(i, j);
    }
    this.open(i, j, true);
    this.setState({cells: this.state.cells});
  }
  handleRightMouseDown(i, j) {
    this.toggleMarked(i, j);
    this.setState({cells: this.state.cells});
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
  onChange: React.PropTypes.func
};

Board.defaultProps = {
  onStart: utils.noop,
  onStop: utils.noop,
  onChange: utils.noop
}

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
      board: null
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
            <Remain
              value={this.state.mines - (this.state.board && this.state.board.markPos.size)}
              />mines
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            time : <Timer interval="1s" limit={999} status={this.state.timerStatus}/>
            <Board
              gameId={this.state.gameId}
              width={this.state.width}
              height={this.state.height}
              mines={this.state.mines}
              onStart={this.handleStart}
              onStop={this.handleStop}
              onChange={board => this.handleBoardChange(board)}
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
    this.setState({board: board});
  }
  handleRetry() {
    this.setState({
      gameId: this.state.gameId + 1,
      timerStatus: Timer.status.notStarted,
      board: null
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
