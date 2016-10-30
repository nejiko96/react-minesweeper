import React, {Component} from 'react';
import {Minesweeper} from './minesweeper';

const styles = {
  container: {
    margin: '2rem'
  }
};

export class MinesweeperDemo extends Component {
  constructor() {
    super();
    this.state = {
      level: '',
      width: '9',
      height: '9',
      mines: '10'
    };
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleWidthChange = this.handleWidthChange.bind(this);
    this.handleHeightChange = this.handleHeightChange.bind(this);
    this.handleMinesChange = this.handleMinesChange.bind(this);
  }
  render() {
    let customFields = null;
    if (this.state.level === "custom") {
      customFields = (
        <div>
          Width:
          <input
            type="text"
            value={this.state.width}
            onChange={this.handleWidthChange}
            />
          <br/>
          Height:
          <input
            type="text"
            value={this.state.height}
            onChange={this.handleHeightChange}
            />
          <br/>
          Mines:
          <input
            type="text"
            value={this.state.mines}
            onChange={this.handleMinesChange}
            />
        </div>
      );
    }
    return (
      <div style={styles.container}>
        Level:
        <select
          value={this.state.level}
          onChange={this.handleLevelChange}
          >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
          <option value="custom">custom</option>
        </select>
        {customFields}
        <Minesweeper
          level={this.state.level}
          width={this.state.width - 0}
          height={this.state.height - 0}
          mines={this.state.mines - 0}
          />
      </div>
    );
  }
  handleLevelChange(e) {
    this.setState({level: e.target.value});
  }
  handleWidthChange(e) {
    this.setState({width: e.target.value});
  }
  handleHeightChange(e) {
    this.setState({height: e.target.value});
  }
  handleMinesChange(e) {
    this.setState({mines: e.target.value});
  }
}
