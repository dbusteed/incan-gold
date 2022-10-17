import { useState, useContext, useEffect } from "react";
import './index.css';
import { GameContext, SocketContext } from "../../context";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

function Scores() {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      setGame(g)
    });
  }, [socket]);

  return (
    <Paper
      className="scores"
      elevation={5}
    >
      <div>
        <div className="flex flex-row justify-between items-center">
          <span className="text-lg uppercase game-font">scores</span>
          <IconButton onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ExpandMoreRoundedIcon /> : <ExpandLessRoundedIcon />}
          </IconButton>
        </div>
        {
          !collapsed &&
          <>
            <hr className="mb-3" />
            <div className="flex flex-col ml-4">
              {
                Object.values(game.players)
                  .sort((a, b) => a.coinSort < b.coinSort ? 1 : -1)
                  .map(p => (
                    <p key={p.name}>{p.name}: {p.tot} / {p.tmp}</p>
                  ))
              }
            </div>
          </>
        }
      </div>
    </Paper>
  );
}

export default Scores;
