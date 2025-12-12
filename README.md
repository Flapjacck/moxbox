<p align="center">
 <img src="frontend/src/assets/boxmox.svg" alt="Boxmox" width="280" />
</p>

# moxbox

I recently bought a new tiny PC (Lenovo M900 tiny) that I will be turning into a proxmox server to experiment with. I wanted to make something personal to run on it.

I’m building moxbox because I’m tired of running out of iCloud space and juggling messy Google Drive folders. I wanted something simple, personal, and fully under my control.

Right now, moxbox is nothing. Eventually, I want it to grow into a clean, minimal, self-hosted storage platform with optional user accounts, metadata, share links, and maybe even NAS or S3-style storage support.

This is my way of learning backend development, exploring Proxmox, and building a tool I actually want to use every day. More features coming as I keep improving it.

## Running on Alpine Linux

Dev mode:

```sh
chmod +x run-alpine.sh
./run-alpine.sh --dev
```

## Server Setup

Finally got my hands on the M900 after waiting weeks because of school. Even though it’s a pretty old PC, it’ll do what I need it to do. It’s in good shape and works perfectly. Specs are:

- Intel i5-6500T  
- 16GB DDR4 2300MHz (pretty sure)  
- 250GB M.2 SSD  

I mean, IMO thats worth it for 100$ CAD. So not a lot of storage, but I recently parted out my broken laptop from years ago and found a 1TB 2.5" HDD that I’m pretty sure is compatible with the M900. I just need to get a SATA cord to make sure the drive still works (the laptop was dropped and didn’t work, so I don’t know what’s actually broken). Mine didn’t come with a bay to mount an extra 2.5" drive, so I’ll have to mount it in a weird way.

Got Proxmox running on it pretty quickly, which was surprising. Usually anything related to hardware either doesn’t want to work or ends up defective the moment I touch it. I have to play around with the Proxmox settings a bit more now that I’ve brought it to my apartment.

### Size Comparision: M900 vs N3ds XL vs Bic Lighter vs Pokemon Card

<img src="https://i.imgur.com/cSpBF9v.jpeg" width="300">

## Open Source & Contributions

I’m more than happy for anyone to contribute, improve features, report issues, or build on top of it. Whether you're fixing a typo or adding a major feature, all contributions are welcome.
