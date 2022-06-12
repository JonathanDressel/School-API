const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = require("../model/users").model;
const Courses = require("../model/courses").model;

const secret = process.env.JWT_SECRET;

function isPasswordValid(user, password) {
    return user && bcrypt.compareSync(password, user.password);
}

function generateAuthToken(user) {
    return jwt.sign({ sub: user._id }, secret, { expiresIn: "24h" });
}

async function isAdmin(req) {
    const user = await getUser(req);
    if (!user) return false;
    return user.role == "admin";
}

async function isInstructor(req, courseId) {
    const user = await getUser(req);
    if (!user) return false;
    const course = await Courses.findOne({_id: courseId, instructorId: user._id});
    return Boolean(course);
}

module.exports = {
    isPasswordValid: isPasswordValid,
    generateAuthToken: generateAuthToken,
    isAdmin: isAdmin,
    isInstructor: isInstructor,
};

async function getUser(req) {
    try {
        const payload = jwt.verify(req.token, secret);
        return await Users.findOne({_id: payload.sub});
    } catch {
        return false;
    }
}
