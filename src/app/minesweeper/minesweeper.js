import React, {Component} from 'react';
import ReactDOM from 'react-dom';

/**
 * utility functions
 */
const utils = {
  noop: () => {},
  fillArray: (n, fn) => Array.from({length: n}, (_, i) => fn(i)),
  fillArray2D: (w, h, fn) => Array.from({length: h}, (_, i) =>
    Array.from({length: w}, (_, j) => fn(i, j))
  ),
  initProperty: (value, def) => value ? Math.min(Math.max(value, def.min), def.max) : def.default,
  addEventListener: (cmp, event, fn) => {
    ReactDOM.findDOMNode(cmp).addEventListener(event, fn);
  },
  removeEventListener: (cmp, event, fn) => {
    ReactDOM.findDOMNode(cmp).removeEventListener(event, fn);
  }
};

/**
 * style settings
 */
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
const cellStyle = i => {
  const x = -cellSize * (i % 3);
  const y = -cellSize * Math.floor(i / 3);
  return {
    backgroundImage: cellImg,
    display: 'inline-block',
    height: cellPx,
    overflow: 'hidden',
    width: cellPx,
    backgroundPosition: `${x}px ${y}px`
  };
};
const styles = {
  counter: textBoxStyle,
  timer: textBoxStyle,
  cells: {
    lineHeight: 0
  },
  cell: utils.fillArray(15, i => cellStyle(i)),
  restart: {},
  space: {
    display: 'inline-block',
    width: '20px'
  }
};

/**
 * locale strings
 */
const localeBundle = {
  en: {
    remain1: '',
    remain2: 'mines',
    timer1: 'time: ',
    timer2: '',
    retry: 'Retry',
    cleared: 'Cleared!'
  },
  ja: {
    remain1: 'あと',
    remain2: '個',
    timer1: '',
    timer2: '秒経過',
    retry: 'もう一回？',
    cleared: 'クリア！'
  }
};

/**
 * counter component
 */
class Counter extends Component {
  render() {
    return (
      <span style={styles.counter} >{this.props.value}</span>
    );
  }
}

Counter.propTypes = {
  value: React.PropTypes.number
};

/**
 * timer componet
 */
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
        default:
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

/**
 * mouse event convert class
 */
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
  static get noop() {
    return {
      handleMouseDown: utils.noop,
      handleMouseUp: utils.noop,
      handleMouseOver: utils.noop,
      handleMouseOut: utils.noop
    };
  }
  constructor(target) {
    this.pressed = 0;
    this.callbacks = [
      [
        target.handleLeftMouseDown,
        target.handleRightMouseDown,
        target.handleBothMouseDown
      ],
      [
        target.handleLeftMouseUp,
        target.handleRightMouseUp,
        target.handleBothMouseUp
      ],
      [
        target.handleLeftMouseOver,
        target.handleRightMouseOver,
        target.handleBothMouseOver
      ],
      [
        target.handleLeftMouseOut,
        target.handleRightMouseOut,
        target.handleBothMouseOut
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

/**
 * cell value container class
 */
class CellValue {
  static get f() {
    return {
      hidden: 1,
      mine: 2,
      marked: 4
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
      marked: 4,
      unmarked: 8
    };
  }
  constructor() {
    this.flags = CellValue.f.hidden;
    this.subFlags = 0;
  }
  get styleIdx() {
    const f = this.flags;
    const sf = this.subFlags;
    if (f === CellValue.f.marked) {
      return CellValue.style.mistake;
    }
    if (f & CellValue.f.marked) {
      return CellValue.style.marked;
    }
    if (f & CellValue.f.hidden) {
      if (sf & CellValue.sf.pressed) {
        return CellValue.style.pressed;
      }
      if (sf & CellValue.sf.pending) {
        return CellValue.style.pending;
      }
      return CellValue.style.hidden;
    }
    if (f & CellValue.f.mine) {
      return (sf & CellValue.sf.exploded) ? CellValue.style.explosion : CellValue.style.mine;
    }
    return CellValue.style.open + (sf & CellValue.sf.hint);
  }
  putMine() {
    this.flags |= CellValue.f.mine;
  }
  press() {
    this.subFlags |= CellValue.sf.pressed;
  }
  release() {
    this.subFlags &= ~CellValue.sf.pressed;
  }
  toggleMark() {
    // already opened
    if (!(this.flags & CellValue.f.hidden)) {
      return CellValue.result.none;
    }
    if (this.flags & CellValue.f.marked) {
      // marked -> pending
      this.flags &= ~CellValue.f.marked;
      this.subFlags |= CellValue.sf.pending;
      return CellValue.result.unmarked;
    }
    if (this.subFlags & CellValue.sf.pending) {
      // pending -> not marked
      this.subFlags &= ~CellValue.sf.pending;
      return CellValue.result.none;
    }
    // not marked -> marked
    this.flags |= CellValue.f.marked;
    return CellValue.result.marked;
  }
  forceMark() {
    this.flags |= CellValue.f.marked;
    this.subFlags &= ~CellValue.sf.pending;
  }
  open(byClick = true) {
    // already opened
    if (!(this.flags & CellValue.f.hidden)) {
      return CellValue.result.none;
    }
    // skip if clicked on mark
    if (this.flags & CellValue.f.marked && byClick) {
      return CellValue.result.none;
    }
    // open
    this.flags &= ~CellValue.f.hidden;

    // if there is a mine
    if (this.flags & CellValue.f.mine) {
      // explode if clicked on mine
      if (byClick) {
        this.subFlags |= CellValue.sf.exploded;
      }
      return CellValue.result.exploded;
    }
    return CellValue.result.opened;
  }
  setHint(hint) {
    this.subFlags |= hint & CellValue.sf.hint;
  }
  getHint() {
    if (this.flags) {
      return -1;
    }
    // no mine, not marked, and opened
    return this.subFlags & CellValue.sf.hint;
  }
}

/**
 * cell component
 */
class Cell extends Component {
  constructor(props) {
    super(props);
    // event binding
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
  }
  render() {
    return (
      <span
        style={styles.cell[this.props.value.styleIdx]}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
        />);
  }
  handleMouseDown(ev) {
    this.props.listener.handleMouseDown(ev, ...this.props.pos);
  }
  handleMouseUp() {
    this.props.listener.handleMouseUp(...this.props.pos);
  }
  handleMouseOver() {
    this.props.listener.handleMouseOver(...this.props.pos);
  }
  handleMouseOut() {
    this.props.listener.handleMouseOut(...this.props.pos);
  }
}

Cell.propTypes = {
  pos: React.PropTypes.array.isRequired,
  value: React.PropTypes.object.isRequired,
  listener: React.PropTypes.object.isRequired
};

/**
 * board component
 */
class Board extends Component {
  init(props) {
    return {
      cells: utils.fillArray2D(props.width, props.height, () => new CellValue()),
      minePos: new Set(),
      markPos: new Set(),
      countDown: props.width * props.height - props.mines,
      listener: new Listener(this)
    };
  }
  startGame(i, j) {
    this.generateMines(i, j);
    this.props.onStart();
  }
  stopGame() {
    this.setState({listener: Listener.noop});
    this.props.onStop();
  }
  resetGame() {
    this.setState(this.init(this.props));
  }
  generateMines(i, j) {
    this.state.minePos.clear();
    const w = this.props.width;
    const h = this.props.height;
    const tgts = utils.fillArray(w * h, k => k);
    const excludes = this.neighbors(i, j).map(([i2, j2]) => i2 * w + j2);
    let t = tgts.length;
    let e = excludes.length;
    let m = this.props.mines;
    while (e--) {
      const k = excludes[e];
      t--;
      [tgts[k], tgts[t]] = [tgts[t], tgts[k]];
    }
    while (m--) {
      const k = Math.floor(Math.random() * t--);
      const tgt = tgts[k];
      const pos = [i, j] = [Math.floor(tgt / w), tgt % w];
      this.state.minePos.add(JSON.stringify(pos));
      this.state.cells[i][j].putMine();
      [tgts[k], tgts[t]] = [tgts[t], tgts[k]];
    }
    this.setState({minePos: this.state.minePos});
  }
  toggleMark(i, j) {
    const result = this.state.cells[i][j].toggleMark();
    if (result === CellValue.result.none) {
      return;
    }
    const pos = JSON.stringify([i, j]);
    switch (result) {
      case CellValue.result.marked:
        this.state.markPos.add(pos);
        break;
      case CellValue.result.unmarked:
        this.state.markPos.delete(pos);
        break;
      default:
        break;
    }
    this.setState({markPos: this.state.markPos});
    this.props.onChange(this.state);
  }
  open(i, j) {
    const result = this.state.cells[i][j].open();
    if (result === CellValue.result.opened) {
      this.state.countDown--;
      this.postOpen(i, j);
    }
    return result;
  }
  postOpen(i, j) {
    const surr = this.surroundings(i, j);
    let hint = 0;
    surr.forEach(pos => {
      if (this.state.minePos.has(JSON.stringify(pos))) {
        hint++;
      }
    });
    this.state.cells[i][j].setHint(hint);
    if (hint > 0) {
      return;
    }
    surr.forEach(([i2, j2]) => this.open(i2, j2));
  }
  areaOpen(i, j) {
    const hint = this.state.cells[i][j].getHint();
    if (hint < 0) {
      return;
    }
    const surr = this.surroundings(i, j);
    let marks = 0;
    surr.forEach(pos => {
      if (this.state.markPos.has(JSON.stringify(pos))) {
        marks++;
      }
    });
    if (marks !== hint) {
      return;
    }
    return surr
      .map(([i2, j2]) => this.open(i2, j2))
      .reduce((a, b) => a | b);
  }
  gameClear() {
    this.stopGame();
    this.state.minePos
      .forEach(pos => {
        const [i, j] = JSON.parse(pos);
        this.state.markPos.add(pos);
        this.state.cells[i][j].forceMark();
      });
    this.setState({markPos: this.state.markPos});
    this.props.onChange(this.state);
  }
  gameOver() {
    this.stopGame();
    new Set([...this.state.minePos, ...this.state.markPos])
      .forEach(pos => {
        const [i, j] = JSON.parse(pos);
        this.state.cells[i][j].open(false);
      });
    this.props.onChange(this.state);
  }
  relatives(i, j, diffs) {
    return diffs
      .map(([di, dj]) => [i + di, j + dj])
      .filter(
        ([i, j]) => this.state.cells[i] && this.state.cells[i][j]
      );
  }
  surroundings(i, j) {
    return this.relatives(i, j,
      [
        [-1, -1], [-1, 0], [-1, 1], [0, 1],
        [1, 1], [1, 0], [1, -1], [0, -1]
      ]
    );
  }
  neighbors(i, j) {
    return this.relatives(i, j,
      [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 0], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ]
    );
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.stopGame.bind(this);
    this.resetGame = this.resetGame.bind(this);
    this.generateMines = this.generateMines.bind(this);
    this.toggleMark = this.toggleMark.bind(this);
    this.open = this.open.bind(this);
    this.postOpen = this.postOpen.bind(this);
    this.areaOpen = this.areaOpen.bind(this);
    this.gameClear = this.gameClear.bind(this);
    this.gameOver = this.gameOver.bind(this);
    this.relatives = this.relatives.bind(this);
    this.handleLeftMouseDown = this.handleLeftMouseDown.bind(this);
    this.handleLeftMouseOver = this.handleLeftMouseOver.bind(this);
    this.handleLeftMouseOut = this.handleLeftMouseOut.bind(this);
    this.handleLeftMouseUp = this.handleLeftMouseUp.bind(this);
    this.handleRightMouseDown = this.handleRightMouseDown.bind(this);
    this.handleBothMouseDown = this.handleBothMouseDown.bind(this);
    this.handleBothMouseOver = this.handleBothMouseOver.bind(this);
    this.handleBothMouseOut = this.handleBothMouseOut.bind(this);
    this.handleBothMouseUp = this.handleBothMouseUp.bind(this);
  }
  componentDidMount() {
    this.setState({listener: new Listener(this)});
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.gameId !== nextProps.gameId) {
      this.resetGame();
    }
  }
  render() {
    const boardNodes = this.state.cells.map((row, i) => {
      const rowNodes = row.map((cell, j) => {
        const pos = [i, j];
        return (
          <Cell
            key={pos}
            pos={pos}
            value={cell}
            listener={this.state.listener}
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
    const result = this.open(i, j);
    if (result === CellValue.result.exploded) {
      this.gameOver();
    }
    if (
      result === CellValue.result.opened &&
      this.state.countDown <= 0
    ) {
      this.gameClear();
    }
    this.setState({
      cells: this.state.cells,
      countDown: this.state.countDown
    });
  }
  handleRightMouseDown(i, j) {
    this.toggleMark(i, j);
    this.setState({cells: this.state.cells});
  }
  handleBothMouseDown(i, j) {
    this.neighbors(i, j).forEach(
      ([i, j]) => this.state.cells[i][j].press()
    );
    this.setState({cells: this.state.cells});
  }
  handleBothMouseOver(i, j) {
    this.neighbors(i, j).forEach(
      ([i, j]) => this.state.cells[i][j].press()
    );
    this.setState({cells: this.state.cells});
  }
  handleBothMouseOut(i, j) {
    this.neighbors(i, j).forEach(
      ([i, j]) => this.state.cells[i][j].release()
    );
    this.setState({cells: this.state.cells});
  }
  handleBothMouseUp(i, j) {
    this.neighbors(i, j).forEach(
      ([i, j]) => this.state.cells[i][j].release()
    );
    const result = this.areaOpen(i, j);
    if (result & CellValue.result.exploded) {
      this.gameOver();
    } else if (
      result & CellValue.result.opened &&
      this.state.countDown <= 0
    ) {
      this.gameClear();
    }
    this.setState({
      cells: this.state.cells,
      countDown: this.state.countDown
    });
  }
}

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
};

/**
 * minesweeper game component
 */
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
    const w = utils.initProperty(props.width, Minesweeper.settings.width);
    const h = utils.initProperty(props.height, Minesweeper.settings.height);
    const m = utils.initProperty(props.mines, Minesweeper.settings.mines(w * h));
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
    const locale = localeBundle[this.props.lang];
    return (
      <div>
        <form>
          <nobr>
            {locale.remain1}<Counter
              value={this.state.mines - (this.state.board && this.state.board.markPos.size)}
              />{locale.remain2}
            <span style={styles.space}/>
            {locale.timer1}<Timer
              interval="1s"
              limit={999}
              status={this.state.timerStatus}
              />{locale.timer2}
            <span style={styles.space}/>
            {this.state.board && this.state.board.countDown <= 0 ? locale.cleared : ''}
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
              >{locale.retry}</button>
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
    this.setState({board});
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
  mines: React.PropTypes.number,
  lang: React.PropTypes.string
};

Minesweeper.defaultProps = {
  level: 'easy',
  lang: 'en'
};
