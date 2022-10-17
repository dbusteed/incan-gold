import React, { useContext } from 'react';
import './index.css';
import { GameContext, WindowContext } from '../../context';
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function TopBar() {
  const [game] = useContext(GameContext);
  const [windows, setWindows] = useContext(WindowContext);

  return (
    <AppBar position="static" className="top-bar" elevation={5}>
      <Toolbar variant="dense">
        {
          (game && game.playing) &&
          <div className="flex">
            <span className="text-xl uppercase game-font">{game.round} - {game.leftovers}</span>
          </div>
        }

        {
          (game && game.playing) &&
          <span className="ml-2 game-font">{game.message}</span>
        }

        <div className="flex-grow"></div>

        <div className="mobile-buttons">
          {
            (game && game.playing)
            && <IconButton
              size="small" edge="end" color="inherit"
              aria-label="chat" sx={{ ml: 0 }}
              onClick={() => setWindows({ ...windows, players: !windows.players })}
            >
              <InfoOutlinedIcon />
            </IconButton>
          }

          {
            game
            && <IconButton
              size="small" edge="end" color="inherit"
              aria-label="chat" sx={{ ml: 0 }}
              onClick={() => setWindows({ ...windows, chat: !windows.chat })}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          }
        </div>

      </Toolbar>
    </AppBar>
  )
}

export default TopBar;