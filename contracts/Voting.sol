pragma solidity ^0.8.0;

contract Voting {
    struct Option {
        string name;
        string image;
        uint score;
    }

    struct Event {
        string eventCode;
        Option[] options;
        mapping(address => bool) hasVoted;
    }
    
    mapping(string => Event) private events;

    // Create a new event with options.
    function createEvent(
        string calldata code,
        string[] calldata names,
        string[] calldata images
    ) external {
        Event storage e = events[code];
        require(e.options.length == 0, "Event already exists");
        require(names.length == images.length, "Names and images length mismatch");
        for (uint i = 0; i < names.length; i++) {
            e.options.push(Option({name: names[i], image: images[i], score: 0}));
        }
    }
    
    // Vote for an option. Records only a bool indicating that the sender voted.
    function vote(string calldata code, uint optionIndex) external {
        Event storage e = events[code];
        require(e.options.length > 0, "Event does not exist");
        require(!e.hasVoted[msg.sender], "Already voted");
        require(optionIndex < e.options.length, "Invalid option");
        e.options[optionIndex].score += 1;
        e.hasVoted[msg.sender] = true;
    }
    
    // Retrieve overall scores: returns names, scores, and images arrays.
    function getEventScores(string calldata code)
        external
        view
        returns (string[] memory, uint[] memory, string[] memory)
    {
        Event storage e = events[code];
        require(e.options.length > 0, "Event does not exist");
        uint len = e.options.length;
        string[] memory names = new string[](len);
        uint[] memory scores = new uint[](len);
        string[] memory images = new string[](len);
        for (uint i = 0; i < len; i++) {
            Option storage opt = e.options[i];
            names[i] = opt.name;
            scores[i] = opt.score;
            images[i] = opt.image;
        }
        return (names, scores, images);
    }
}
