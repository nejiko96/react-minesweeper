/**
 * React.js minesweeper
 * Date: 2016/10/31
 *
 * Copyright (c) 2016 H.Nakatani
 * Released under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
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
      lang: 'en',
      level: 'easy',
      width: '',
      height: '',
      mines: ''
    };
    this.handleLangChange = this.handleLangChange.bind(this);
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleWidthChange = this.handleWidthChange.bind(this);
    this.handleHeightChange = this.handleHeightChange.bind(this);
    this.handleMinesChange = this.handleMinesChange.bind(this);
  }
  render() {
    return (
      <div style={styles.container}>
        Lang:
        <select
          value={this.state.lang}
          onChange={this.handleLangChange}
          >
          <option value="en">en(default)</option>
          <option value="ja">ja</option>
        </select>
        <br/>
        Level:
        <select
          value={this.state.level}
          onChange={this.handleLevelChange}
          >
          <option value="easy">easy(default)</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
          <option value="custom">custom</option>
        </select>
        {this.state.level === "custom" &&
          <div>
            Width:
            <input
              type="text"
              value={this.state.width}
              placeholder="9 - 30"
              onChange={this.handleWidthChange}
              />
            <br/>
            Height:
            <input
              type="text"
              value={this.state.height}
              placeholder="9 - 24"
              onChange={this.handleHeightChange}
              />
            <br/>
            Mines:
            <input
              type="text"
              value={this.state.mines}
              placeholder="10 - 999"
              onChange={this.handleMinesChange}
              />
          </div>
        }
        <p/>
        <Minesweeper
          lang={this.state.lang}
          level={this.state.level}
          width={this.state.width - 0}
          height={this.state.height - 0}
          mines={this.state.mines - 0}
          />
      </div>
    );
  }
  handleLangChange(e) {
    this.setState({lang: e.target.value});
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
