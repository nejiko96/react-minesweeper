import React, {Component} from 'react';

const styles = {
  footer: {
    padding: '0.5rem',
    fontSize: '1rem',
    backgroundColor: '#1f1f1f',
    textAlign: 'center',
    color: 'white'
  }
};

export class Footer extends Component {
  render() {
    return (
      <footer style={styles.footer}>
        react-minesweeper by nejiko96<br/>
        <a href="https://github.com/nejiko96/react-minesweeper">
          https://github.com/nejiko96/react-minesweeper
        </a>
      </footer>
    );
  }
}
