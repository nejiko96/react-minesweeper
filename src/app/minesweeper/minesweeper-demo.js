import React, {Component} from 'react';
import {Minesweeper} from './minesweeper';

const styles = {
  container: {
    margin: '1rem'
  }
};

export class MinesweeperDemo extends Component {
  constructor() {
    super();
    this.state = {
      level: '',
      width: 0,
      height: 0,
      mines: 0
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  render() {
    return (
      <div style={styles.container}>
        <form onSubmit={this.handleSubmit}>
          Level:
          <select
            defaultValue=""
            ref={c => {
              this.level = c;
            }}
            >
            <option value="">Default(easy)</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
            <option value="custom">custom</option>
          </select>
          <br/>
          Width:
          <input
            type="number"
            defaultValue="0"
            ref={c => {
              this.width = c;
            }}
            />
          <br/>
          Height:
          <input
            type="number"
            defaultValue="0"
            ref={c => {
              this.height = c;
            }}
            />
          <br/>
          Mines:
          <input
            type="number"
            defaultValue="0"
            ref={c => {
              this.mines = c;
            }}
            />
          <br/>
          <button type="submit">Change</button>
        </form>
        <Minesweeper
          level={this.state.level}
          width={this.state.width}
          height={this.state.height}
          mines={this.state.mines}
          />
      </div>
    );
  }
  handleSubmit(e) {
    e.preventDefault();
    this.setState({
      level: this.level.value,
      width: parseInt(this.width.value, 10),
      height: parseInt(this.height.value, 10),
      mines: parseInt(this.mines.value, 10)
    });
  }
}
