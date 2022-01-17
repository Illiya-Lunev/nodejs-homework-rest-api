const express = require('express');
const { User } = require('../../model');
const { authToken, upload } = require('../../middleware');
const { Unauthorized } = require('http-errors');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require('jimp');

const router = express.Router();

const avatarDir = path.join(__dirname, '../../', 'public', 'avatars');

router.get('/current', authToken, async (req, res) => {
  const { email } = req.user;
  res.json({
    user: {
      email,
    },
  });
});

router.get('/logout', authToken, async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findByIdAndUpdate(_id, { token: null });
  if (!user) {
    throw new Unauthorized('Not authorized');
  }
  res.status(204).send();
});

router.patch(
  '/avatars',
  authToken,
  upload.single('avatar'),
  async (req, res) => {
    const { path: tempUpload, filename } = req.file;
    const [extension] = filename.split('.').reverse();
    const newFileName = `${req.user._id}.${extension}`;
    const fileUpload = path.join(avatarDir, newFileName);
    await fs.rename(tempUpload, fileUpload);
    const avatarURL = path.join('avatars', newFileName);

    const avatarReSize = await Jimp.read(fileUpload);
    avatarReSize.resize(250, 250);
    avatarReSize.write(fileUpload);
    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  },
);

module.exports = router;
