import { useState, useContext, useEffect } from "react";
import './index.css';
import { GameContext, SocketContext } from "../../context";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

function Details(props) {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [collapsed, setCollapsed] = useState(false);

  const mobile = props.mobile;

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      setGame(g)
    });
  }, [socket]);

  return (
    <Paper
      className="details"
      elevation={5}
    >
      <div>
        <div className="flex flex-row justify-between items-center">
          <span className="text-lg uppercase game-font">adventurers</span>
          <IconButton style={{ display: mobile ? "none" : "inline-flex" }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ExpandMoreRoundedIcon /> : <ExpandLessRoundedIcon />}
          </IconButton>
        </div>
        {
          !collapsed &&
          <>
            <hr className="mb-3" />
            <div className="flex justify-around mb-5">
              <div className="flex flex-col items-center">
                <span className="text-sm uppercase underline game-font">camp</span>
                {
                  Object.values(game.players)
                    .filter(p => p.status === "RETURNED")
                    .map(p => (
                      <p key={p.name}>{p.name}</p>
                    ))
                }
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm uppercase underline game-font">dungeon</span>
                {
                  Object.values(game.players)
                    .filter(p => p.status !== "RETURNED")
                    .map(p => (
                      <p key={p.name}>{p.name}</p>
                    ))
                }
              </div>
            </div>
          </>
        }
      </div>

      {
        (mobile && game.showScores) &&
        <div>
          <div className="flex flex-row justify-between items-center">
            <span className="text-lg uppercase game-font">scores</span>
          </div>
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
        </div>
      }
    </Paper>
  );
}

export default Details;
