import React, { useState, useEffect } from 'react'
import { SocketContext, socket, GameContext, WindowContext } from './context';
import { createTheme, ThemeProvider } from '@mui/material';
import GameRoom from './components/gameRoom';
import MainLobby from './components/mainLobby';
import TopBar from './components/topBar';


const theme = createTheme({
  palette: {
    primary: { main: "#487555", },
    success: { main: "#5D9970", },
    warning: { main: "#E43E4C", },
    black: { main: "#000000", }
  }
});

function App() {
  const [game, setGame] = useState(null);
  const [windows, setWindows] = useState({
    chat: false,
    players: false,
  });

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      setGame(g);
    });
  }, [socket]);

  return (
    <ThemeProvider theme={theme}>
    <SocketContext.Provider value={socket}>
    <GameContext.Provider value={[game, setGame]}>
    <WindowContext.Provider value={[windows, setWindows]}>
      <TopBar />
      {
        game
        ? <GameRoom />
        : <MainLobby />
      }
    </WindowContext.Provider>
    </GameContext.Provider>
    </SocketContext.Provider>
    </ThemeProvider>
  );

}

export default App;
