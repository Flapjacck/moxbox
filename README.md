<p align="center">
 <img src="frontend/src/assets/boxmox.svg" alt="Boxmox" width="280" />
</p>

# moxbox

I recently bought a new tiny PC (Lenovo M900 tiny) that I will be turning into a proxmox server to experiment with. I wanted to make something personal to run on it.

I’m building moxbox because I’m tired of running out of iCloud space and juggling messy Google Drive folders. I wanted something simple, personal, and fully under my control.

Right now, moxbox is nothing. Eventually, I want it to grow into a clean, minimal, self-hosted storage platform with optional user accounts, metadata, share links, and maybe even NAS or S3-style storage support.

This is my way of learning backend development, exploring Proxmox, and building a tool I actually want to use every day. More features coming as I keep improving it.

## Open Source & Contributions

I’m more than happy for anyone to contribute, improve features, report issues, or build on top of it. Whether you're fixing a typo or adding a major feature, all contributions are welcome.

## Running on Alpine Linux

Dev mode:

```sh
chmod +x run-alpine.sh
./run-alpine.sh --dev
```

Prod mode:

```sh
chmod +x run-alpine.sh
./run-alpine.sh --build --password "your-secure-password"
```

custom ports:

```sh
./run-alpine.sh --dev --port 4200 --frontend-port 5173
```
