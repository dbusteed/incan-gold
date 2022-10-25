# Incan Gold

Multiplayer browser adaption of the [Incan Gold board game](https://boardgamegeek.com/boardgame/15512/incan-gold)

## Stack

* NodeJS + Express
* SocketIO
* React + MUI
* NGINX + LetsEncrypt

## Deployment

Here's the steps I took to deploy the app on a RaspberryPi:

1. Grab a free DNS name from [https://freedns.afraid.org/](https://freedns.afraid.org/)
    1. after making an account, you can find a domain like `mooo.com`, and create a subdomain that points to your public IP address (for example: `cows-go.mooo.com`)
1. Add port forwarding on your router to map ports **80** and **443** to your machine (in my case, the RPi)
1. Connect to the machine (directly or via SSH)
1. Install NGINX and make sure it's running
    1. you should be able to navigate to your domain (over **HTTP**) and see the default NGINX page
1. Install [certbot](https://certbot.eff.org/), and follow the instructions for obtaining a certificate with a NGINX setup
    1. enter your domain when prompted
    1. if successful, you should be able to visit your domain over **HTTPS**
1. Edit your NGINX configuration file (`/etc/nginx/sites-enabled/default`), and locate the server block which is listening for port **443** (you'll something like `listen 443 ssl;`)
    1. replace the current `location /` block with the following:

        ```
        location / {
            proxy_pass https://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
        ```
    1. restart NGINX with `nginx -s reload`
1. Install NodeJS if you haven't already
1. Clone the repo, and nstall modules for the server and the client
    ```bash
    git clone <REPO_URL>
    cd incan_gold
    npm i && cd client && npm i && cd ..
    ```
1. Rename `client/.env-template` as `client/.env`, and change the `REACT_APP_SOCKET_URL` to your domain name (make sure to use HTTPS!)
1. Copy your SSL key and cert to the `ssl` folder
    ```bash
    # might need to be sudo for this
    cp /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem ssl/.
    cp /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem ssl/.
    ```
1. Inside the `incan_gold/` folder, run `yarn build`
    * this will build the client and move the files up one level so that the server can find them
1. That's it! Test everything by running `node index.mjs`
    * this will run the Express server, and server the React client from the `build/` folder
    * there's a few options to run this in the background, for example: `nohup node index.mjs &`

## Thanks

https://adrianturcato.medium.com/deploying-web-app-react-express-nodejs-socket-io-and-ubuntu-20-04-lts-x64-8879d9ebc267
