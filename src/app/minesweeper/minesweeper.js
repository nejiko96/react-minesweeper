import React, {Component} from 'react';

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

const settings = {
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
  },
  cellTypes: {
    hidden: '0',
    notMarked: '01',
    flagged: '0f',
    uncertain: '0h',
    open: '1',
    vacant: '10',
    mine: '09',
    explosion: '1a',
    mistake: '1b'
  },
  flagTypes: {
    hasMine: 1,
    hasFlag: 2
  },
};

const utils = {
  getProperty: (value, opt) => value ? Math.min(Math.max(value, opt.min), opt.max) : opt.default,
  fillArray2D: (w, h, value) => Array.apply(null, Array(h)).map(() => Array(w).fill(value))
};

class MinesweeperRemain extends Component {
  render() {
    return (
      <span style={styles.remain} >{this.props.value}</span>
    );
  }
}

MinesweeperRemain.propTypes = {
  value: React.PropTypes.number
};

class MinesweeperTimer extends Component {
  timeParse(value) {
    const powers = {
      ms: 1,
      s: 1000
    };
    const result = /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/.exec(value.trim());
    if (result[2]) {
      const num = parseFloat(result[1]);
      const mult = powers[result[2]] || 1;
      return num * mult;
    }
    return value;
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
  }
  constructor(props) {
    super(props);
    this.state = {count: 0};
    // event binding
    this.timeParse = this.timeParse.bind(this);
    this.start = this.start.bind(this);
    this.update = this.update.bind(this);
    this.stop = this.stop.bind(this);
  }
  componentDidMount() {
    if (this.props.running) {
      this.start();
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.running !== nextProps.running) {
      if (nextProps.running) {
        this.start();
      } else {
        this.stop();
      }
    }
  }
  render() {
    return (
      <span style={styles.timer} >{this.state.count}</span>
    );
  }
}

MinesweeperTimer.propTypes = {
  interval: React.PropTypes.string.isRequired,
  limit: React.PropTypes.number,
  running: React.PropTypes.bool.isRequired
};

class MinesweeperBoard extends Component {
  defaultSize(level) {
    return settings.levels[level];
  }
  customSize(props) {
    const w = utils.getProperty(props.width, settings.width);
    const h = utils.getProperty(props.height, settings.height);
    const m = utils.getProperty(props.mines, settings.mines(w * h));
    return {
      width: w,
      height: h,
      mines: m
    };
  }
  init(props) {
    const size = this.defaultSize(props.level) || this.customSize(props);
    const w = size.width;
    const h = size.height;
    const other = {
      remain: size.mines,
      cells: utils.fillArray2D(w, h, settings.cellTypes.notMarked),
      flags: utils.fillArray2D(w, h, 0)
    };
    return Object.assign({}, size, other);
  }
  startGame() {
    this.props.onStart();
  }
  stopGame() {
    this.props.onStop();
  }
  constructor(props) {
    super(props);
    this.state = this.init(props);
    // event binding
    this.startGame = this.startGame.bind(this);
    this.stopGame = this.startGame.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
  }
  componentDidMount() {
    this.props.onRemainChange(this.state.remain);
  }
  render() {
    const boardNodes = this.state.cells.map((row, i) => {
      const rowNodes = row.map((cell, j) => {
        const key = `${i}_${j}`;
        return (
          <span
            key={key}
            style={styles.cell[cell]}
            onMouseDown={() => this.handleMouseDown(i, j)}
            onMouseUp={() => this.handleMouseUp(i, j)}
            onMouseOver={() => this.handleMouseOver(i, j)}
            onMouseOut={() => this.handleMouseOut(i, j)}
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
  handleMouseDown(i, j) {
    console.log(`handleMouseDown(${i}, ${j})`);
  }
  handleMouseUp(i, j) {
    console.log(`handleMouseUp(${i}, ${j})`);
  }
  handleMouseOver(i, j) {
    console.log(`handleMouseOver(${i}, ${j})`);
  }
  handleMouseOut(i, j) {
    console.log(`handleMouseOut(${i}, ${j})`);
  }
}

MinesweeperBoard.propTypes = {
  gameId: React.PropTypes.number.isRequired,
  level: React.PropTypes.string.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  mines: React.PropTypes.number,
  onStart: React.PropTypes.func,
  onStop: React.PropTypes.func,
  onRemainChange: React.PropTypes.func
};

export class Minesweeper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: 1,
      running: false,
      remain: 0
    };
    // event binding
    this.handleStart = this.handleStart.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.handleRemainChange = this.handleRemainChange.bind(this);
    this.handleRetry = this.handleRetry.bind(this);
  }
  render() {
    return (
      <form>
        <nobr>
          <MinesweeperRemain value={this.state.remain}/>mines
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          time : <MinesweeperTimer interval="1s" limit={999} running={this.state.running}/>
          <MinesweeperBoard
            gameId={this.state.gameId}
            level={this.props.level || 'easy'}
            width={this.props.width}
            height={this.props.height}
            mines={this.props.mines}
            onStart={this.handleStart}
            onStop={this.handleStop}
            onRemainChange={this.handleRemainChange}
            />
          <button
            type="button"
            style={styles.restart}
            onClick={this.handleRetry}
            >Retry</button>
        </nobr>
      </form>
    );
  }
  handleStart() {
    this.setState({running: true});
  }
  handleStop() {
    this.setState({running: false});
  }
  handleRemainChange(value) {
    this.setState({remain: value});
  }
  handleRetry() {
    this.setState({gameId: this.state.gameId + 1});
  }
}

Minesweeper.propTypes = {
  level: React.PropTypes.string,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  mines: React.PropTypes.number
};
