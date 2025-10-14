var express = require('express');
var bodyParser = require('body-parser');
const { use } = require('react');
var router = express.Router();

router.use(bodyParser.json());

let users = [
    {id: 1, name: 'Bernadette Evans'},
    {id: 2, name: 'Ryoken Kurokawa'}
]

/* PATH to 'GET' test page. */
router.get('/', function(req, res) {
    res.json (users);
});

//PATH user
router.post('/', function(req, res) {
    const newUser = req.body;
    users.push(newUser);
    res.json ({
        message: 'User added successfully!',
        allUser: users
    });
});

router.put('/:id', function(req, res) {
    const id = parseInt(req.params.id);
    const updatedUser = req.body;   
    const userIndex = users.findIndex((user) => user.id === id);

    if(userIndex === -1) {
        return res.status(404).json({message: 'User not found'});
    }
    users[userIndex] = updatedUser;
    res.json({
        message: 'User updated successfully!',
        user: users[userIndex]
    });
});

module.exports = router;