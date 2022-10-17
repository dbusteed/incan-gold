import { useContext, useEffect, useState, useRef } from "react";
import './index.css';
import { GameContext, SocketContext, WindowContext } from "../../context";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// svgs
import { ReactComponent as Coins1 } from '../../svgs/1.svg';
import { ReactComponent as Coins2 } from '../../svgs/2.svg';
import { ReactComponent as Coins3 } from '../../svgs/3.svg';
import { ReactComponent as Coins4 } from '../../svgs/4.svg';
import { ReactComponent as Coins5 } from '../../svgs/5.svg';
import { ReactComponent as Coins6 } from '../../svgs/6.svg';
import { ReactComponent as Coins7 } from '../../svgs/7.svg';
import { ReactComponent as Coins8 } from '../../svgs/8.svg';
import { ReactComponent as Coins9 } from '../../svgs/9.svg';
import { ReactComponent as Coins10 } from '../../svgs/10.svg';
import { ReactComponent as Coins11 } from '../../svgs/11.svg';
import { ReactComponent as Coins12 } from '../../svgs/12.svg';
import { ReactComponent as Coins13 } from '../../svgs/13.svg';
import { ReactComponent as Coins14 } from '../../svgs/14.svg';
import { ReactComponent as Coins15 } from '../../svgs/15.svg';
import { ReactComponent as Coins16 } from '../../svgs/16.svg';
import { ReactComponent as Coins17 } from '../../svgs/17.svg';
import { ReactComponent as Coins18 } from '../../svgs/18.svg';
import { ReactComponent as Coins19 } from '../../svgs/19.svg';
import { ReactComponent as SpidersSVG } from '../../svgs/spiders.svg';
import { ReactComponent as SnakeSVG } from '../../svgs/snake.svg';
import { ReactComponent as RocksSVG } from '../../svgs/rocks.svg';
import { ReactComponent as FloodSVG } from '../../svgs/flood.svg';
import { ReactComponent as FireSVG } from '../../svgs/fire.svg';
import { ReactComponent as Square5 } from '../../svgs/square_5.svg';
import { ReactComponent as Star5 } from '../../svgs/star_5.svg';
import { ReactComponent as Frog7 } from '../../svgs/frog_7.svg';
import { ReactComponent as Hand7 } from '../../svgs/hand_7.svg';
import { ReactComponent as Head11 } from '../../svgs/head_11.svg';
import { ReactComponent as Crown11 } from '../../svgs/crown_11.svg';

const Game = () => {
  const socket = useContext(SocketContext);
  const [game, setGame] = useContext(GameContext);
  const [windows, setWindows] = useContext(WindowContext);
  const [btnsDisabled, setBtnsDisabled] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const svgMap = {
    '1': <Coins1 className="card-svg" />,
    '2': <Coins2 className="card-svg" />,
    '3': <Coins3 className="card-svg" />,
    '4': <Coins4 className="card-svg" />,
    '5': <Coins5 className="card-svg" />,
    '6': <Coins6 className="card-svg" />,
    '7': <Coins7 className="card-svg" />,
    '8': <Coins8 className="card-svg" />,
    '9': <Coins9 className="card-svg" />,
    '10': <Coins10 className="card-svg" />,
    '11': <Coins11 className="card-svg" />,
    '12': <Coins12 className="card-svg" />,
    '13': <Coins13 className="card-svg" />,
    '14': <Coins14 className="card-svg" />,
    '15': <Coins15 className="card-svg" />,
    '16': <Coins16 className="card-svg" />,
    '17': <Coins17 className="card-svg" />,
    '18': <Coins18 className="card-svg" />,
    '19': <Coins19 className="card-svg" />,
    'spiders': <SpidersSVG className="card-svg" />,
    'snake': <SnakeSVG className="card-svg" />,
    'rocks': <RocksSVG className="card-svg" />,
    'flood': <FloodSVG className="card-svg" />,
    'fire': <FireSVG className="card-svg" />,
    'square_5': <Square5 className="card-svg" />,
    'star_5': <Star5 className="card-svg" />,
    'frog_7': <Frog7 className="card-svg" />,
    'hand_7': <Hand7 className="card-svg" />,
    'head_11': <Head11 className="card-svg" />,
    'crown_11': <Crown11 className="card-svg" />,
  }

  useEffect(() => {
    if (!socket) return;
    socket.on("gameUpdate", g => {
      if (g.players[socket.id].status !== "RETURNED") {
        setBtnsDisabled(false);
      }
      setGameOver(g.gameOver);
      setGame(g);
    });
  }, [socket]);

  const emitDecision = (decision) => {
    socket.emit("playerDecision", decision);
    setBtnsDisabled(true);
  }

  const ScollToMe = () => {
    const elementRef = useRef();
    useEffect(() => elementRef.current.scrollIntoView());
    return <div ref={elementRef} />;
  };

  return (
    <div className="game-main">

      <Dialog
        open={game.gameOver}
      >
        <DialogTitle>
          Game Over!
        </DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Adventurer</TableCell>
                <TableCell align="center">Total Treasure</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                Object.values(game.players)
                  .sort((a, b) => b.tot - a.tot)
                  .map(p => (
                    <TableRow key={p.name}>
                      <TableCell align="center">{p.name}</TableCell>
                      <TableCell align="center">{p.tot}</TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => {
            setGame(null);
            socket.emit("leaveGame");
          }}>Main Menu</Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={5} className="status-bar">
        <span className="text-med uppercase game-font">Round {game.roundStr}</span>
        <span className="game-font">{game.message}</span>
        <div className="flex items-center">
          <span className="text-med uppercase game-font mr-2">Leftovers</span>
          <span className="text-3xl uppercase game-font">{game.leftovers}</span>
        </div>
      </Paper>

      <div className="cards-container">
        {
          game.drawn.map((d, idx) => (
            <div
              className="card" key={idx}
              style={{ "opacity": (d.type === "artifact_taken" ? "50%" : "100%") }}
            >
              {
                svgMap[d.value]
              }
            </div>
          ))
        }
        <ScollToMe />
      </div>

      <Paper className="player-hud">
        <div>
          {
            Object.values(game.players)
              .filter(p => p.pid === socket.id)
              .map(p => (
                <div className="player-hud-text uppercase game-font" key={p.pid}>
                  <div className="flex items-center justify-end">
                    <span className="text-base mr-3">Backpack</span><span className="text-3xl">{p.tmp}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-base mr-3">Tent</span><span className="text-3xl">{p.tot}</span>
                  </div>
                </div>
              ))
          }
        </div>
        <div className="player-hud-buttons">
          <Button style={{ "fontSize": "1.2rem", "marginRight": "1rem" }} color="warning" size="large" disabled={btnsDisabled} onClick={() => emitDecision("return")} variant="contained">Return</Button>
          <Button style={{ "fontSize": "1.2rem" }} color="success" size="large" disabled={btnsDisabled} onClick={() => emitDecision("continue")} variant="contained">Continue</Button>
        </div>
      </Paper>
    </div>
  )
}

export default Game;