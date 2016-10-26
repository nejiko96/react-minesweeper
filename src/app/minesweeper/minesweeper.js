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

const cellStyle = function (left, top) {
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
    '1b': cellStyle(2, 4),
  },
  restart: {}
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
  constructor(props) {
    super(props);
    this.state = {count: 0};
    // event binding
    this.timeParse = this.timeParse.bind(this)
    this.start = this.start.bind(this)
    this.update = this.update.bind(this)
    this.stop = this.stop.bind(this)
  }
  timeParse(value) {
    const powers = {
      'ms': 1,
      's': 1000
    }
    if (value === undefined || value === null) {
      return null;
    }
    let result = /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/.exec(value.toString().trim());
    if (result[2]) {
      let num = parseFloat(result[1]);
      let mult = powers[result[2]] || 1;
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
  componentWillReceiveProps(nextProps) {
    if (this.props.running !== nextProps.running) {
      if (nextProps.running) {
        this.start();
      } else {
        this.stop();
      }
    }
  }
  componentDidMount() {
    if (this.props.running) {
      this.start();
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
    return {
      easy: {
        width:   9,
        height:  9,
        mines:  10
      },
      medium: {
        width:  16,
        height: 16,
        mines:  40
      },
      hard: {
        width:  30,
        height: 16,
        mines:  99
      }
    }[level];
  }
  customSize(props) {
    const w = props.width ? this.inRange(props.width, 9, 30) : 9;
    const h = props.height ? this.inRange(props.height, 9, 24) : 9;
    const n = w * h;
    const m = props.mines ?
      this.inRange(props.mines, 10, this.maxMines(n)) :
      this.defaultMines(n);
    return {
      witdh: w,
      height: h,
      mines: m
    }
  }
  inRange(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  maxMines(n) {
    return Math.floor(n * 0.94 - 8.45);
  }
  defaultMines(n) {
    const percent = 10 + Math.floor(n / 45);
    return Math.round(n * percent / 1000) * 10;
  }
  fillArray2D(w, h, value) {
    return Array.apply(null, Array(h)).map(function() { return Array(w).fill(value); });
  }
  init(props) {
    const size = this.defaultSize(props.level) || this.customSize(props);
    console.log(size);
    const w = size.width;
    const h = size.height;
    const other = {
      remain: size.mines,
      cells: this.fillArray2D(w, h, MinesweeperBoard.cellTypes.notMarked),
      flags: this.fillArray2D(w, h, 0)
    };
    return Object.assign({},size, other);
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
  }
  componentDidMount() {
    this.props.onRemainChange(this.state.remain);
  }
  render() {
    console.log(this.state.cells);
    const boardNodes = this.state.cells.map(function(row) {
      const rowNodes = row.map(function(cell) {
        return (
          <span style={styles.cell[cell]}></span>
        );
      });
      return (
        <div>
          {rowNodes}<br />
        </div>
      );
    });
    // for (idx = 0; idx < this._cells; idx++) {
    //   if (idx > 0 && idx % this._width === 0) {
    //     html += '<br />';
    //   }
    //   html += '<span></span>';
    // }
    return (
      <div style={styles.cells}>
        {boardNodes}
      </div>
    );
  }
}

MinesweeperBoard.propTypes = {
  gameId: React.PropTypes.number.isRequired,
  level: React.PropTypes.string.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  mines: React.PropTypes.number
};

MinesweeperBoard.cellTypes = {
  hidden: '0',
  notMarked: '01',
  flagged: '0f',
  uncertain: '0h',
  open: '1',
  vacant: '10',
  mine: '09',
  explosion: '1a',
  mistake: '1b'
}

MinesweeperBoard.flagTypes = {
  hasMine: 1,
  hasFlag: 2
}

export class Minesweeper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: 1,
      running: false,
      remain: 0
    };
    // event binding
    this.handleStart = this.handleStart.bind(this)
    this.handleStop = this.handleStop.bind(this)
    this.handleRemainChange = this.handleRemainChange.bind(this)
    this.handleRetry = this.handleRetry.bind(this)
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
  render() {
    return (
      <form>
        <nobr>
          <MinesweeperRemain value={this.state.remain}/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <MinesweeperTimer interval="1s" limit={999} running={this.state.running}/>
          <MinesweeperBoard
            gameId={this.state.gameId}
            level={this.props.level}
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
}

Minesweeper.propTypes = {
  level: React.PropTypes.string.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  mines: React.PropTypes.number
};
