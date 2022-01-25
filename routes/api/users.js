const express = require('express');
const { User } = require('../../model');
const { authToken, upload } = require('../../middleware');
const { Unauthorized } = require('http-errors');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require('jimp');
const { NotFound, BadRequest } = require('http-errors');
const { sendEmail } = require('../../helpers');
const { SITE_NAME } = process.env;

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

router.get('/verify/:verificationToken', async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw new NotFound('User not found');
    }
    await User.findByIdAndUpdate(user._id, {
      verificationToken: null,
      verify: true,
    });
    res.json({
      message: 'Verification successful',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequest('missing required field email');
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFound('User not found');
    }
    if (user.verify) {
      throw new BadRequest('Verification has already been passed');
    }

    const { verificationToken } = user;
    const data = {
      to: email,
      subject: 'Confirm email',
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Confirm email</a>`,
    };

    await sendEmail(data);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
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

    try {
      const avatarReSize = await Jimp.read(fileUpload);
      avatarReSize.resize(250, 250);
      avatarReSize.write(fileUpload);
    } catch (error) {
      console.log(error);
    }

    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  },
);

module.exports = router;
