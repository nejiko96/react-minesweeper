import React, {Component} from 'react';
import {Title} from './title';
import {MinesweeperBox} from './minesweeper/minesweeper-box';
import {Footer} from './footer';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  }
};

export class Main extends Component {
  render() {
    return (
      <div style={styles.container}>
        <main style={styles.main}>
          <Title/>
          <MinesweeperBox/>
        </main>
        <Footer/>
      </div>
    );
  }
}
