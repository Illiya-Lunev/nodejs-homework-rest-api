const express = require('express');
const { User } = require('../../model');
const { BadRequest, Conflict, Unauthorized } = require('http-errors');
const { joiRegisterSchema, joiLoginSchema } = require('../../model/user');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const { nanoid } = require('nanoid');
const { sendEmail } = require('../../helpers/');

const { SECRET_KEY, SITE_NAME } = process.env;

router.post('/signup', async (req, res, next) => {
  try {
    const { error } = joiRegisterSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict('Email in use');
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const verificationToken = nanoid();
    const avatarURL = gravatar.url(
      email,
      { s: '250', r: 'g', d: 'avatar' },
      false,
    );
    const newUser = await User.create({
      email,

      avatarURL,
      verificationToken,
      password: hashPassword,
    });

    const data = {
      to: email,
      subject: 'Confirm your email',
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Confirm your email</a>`,
    };

    await sendEmail(data);
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error } = joiLoginSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Unauthorized('Email or password is wrong');
    }
    if (!user.verify) {
      throw new Unauthorized('Email not verify');
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw new Unauthorized('Email or password is wrong');
    }
    const { _id } = user;

    const payload = {
      id: _id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '3h' });
    await User.findByIdAndUpdate(_id, { token });
    res.json({ token, user: { email } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
