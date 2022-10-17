import React, { useContext, useEffect } from 'react';
import './index.css';
import { SocketContext, GameContext, WindowContext } from '../../context';

// components
import Game from './../game';
import Chat from './../chat';
import Scores from './../scores';
import Details from './../details';
import GameLobby from './../gameLobby';

// material
import Drawer from "@mui/material/Drawer";


function GameRoom() {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [windows, setWindows] = useContext(WindowContext);

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      setGame(g);
    });
  }, [socket]);

  return (
    <div className="game-window img-background">
      {
        game.playing
          ? <Game />
          : <GameLobby />
      }

      {/* DESKTOP */}
      <div className="side-bar">
        <Details mobile={false} />
        {
          game.showScores &&
          <Scores />
        }
        <Chat mobile={false} />
      </div>

      {/* MOBILE */}
      <Drawer
        open={windows.chat}
        anchor="right"
        onClose={() => setWindows({ ...windows, chat: !windows.chat })}
      >
        <Chat mobile={true} />
      </Drawer>

      <Drawer
        open={windows.players}
        anchor="right"
        onClose={() => setWindows({ ...windows, players: !windows.players })}
      >
        <Details mobile={true} />
      </Drawer>

    </div>
  )
}

export default GameRoom;