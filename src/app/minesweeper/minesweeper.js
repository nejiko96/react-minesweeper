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
  cell01: cellStyle(0, 0),
  cell0f: cellStyle(1, 0),
  cell0h: cellStyle(2, 0),
  cell10: cellStyle(0, 1),
  cell11: cellStyle(1, 1),
  cell12: cellStyle(2, 1),
  cell13: cellStyle(0, 2),
  cell14: cellStyle(1, 2),
  cell15: cellStyle(2, 2),
  cell16: cellStyle(0, 3),
  cell17: cellStyle(1, 3),
  cell18: cellStyle(2, 3),
  cell19: cellStyle(0, 4),
  cell1a: cellStyle(1, 4),
  cell1b: cellStyle(2, 4),
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
    this.interval = this.timeParse(props.interval);
    this.state = {count: 0};
    // event binding
    this.start = this.start.bind(this)
    this.update = this.update.bind(this)
    this.stop = this.stop.bind(this)
  }
  timeParse(value) {
    const regex = /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/;
    const powers = {
      // Yeah this is major overkill...
      'ms': 1,
      'cs': 10,
      'ds': 100,
      's': 1000,
      'das': 10000,
      'hs': 100000,
      'ks': 1000000
    }
    if (value === undefined || value === null) {
      return null;
    }
    let result = regex.exec(value.toString().trim());
    if (result[2]) {
      let num = parseFloat(result[1]);
      let mult = powers[result[2]] || 1;
      return num * mult;
    }
    return value;
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.interval !== nextProps.interval) {
      this.interval = this.timeParse(nextProps.interval);
    }
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
  start() {
    this.setState({count: 0});
    this.intervalID = setInterval(this.update, this.interval);
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

class MineseeperCells extends Component {
  render() {
    // for (idx = 0; idx < this._cells; idx++) {
    //   if (idx > 0 && idx % this._width === 0) {
    //     html += '<br />';
    //   }
    //   html += '<span></span>';
    // }
    return (
      <div style={styles.cells}>
        <span>MineseeperCells will be rendered here.</span>
      </div>
    );
  }
}

export class Minesweeper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      running: false,
      remain: 10
    };
    // event binding
    this.handleRestart = this.handleRestart.bind(this)
  }
  handleRestart() {
    this.setState({running: !this.state.running});
  }
  render() {
    return (
      <form>
        <nobr>
          <MinesweeperRemain value={this.state.remain}/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <MinesweeperTimer interval="1s" limit={999} running={this.state.running}/>
          <MineseeperCells/>
          <button
            type="button"
            style={styles.restart}
            onClick={this.handleRestart}
            >Restart</button>
        </nobr>
      </form>
    );
  }
}
