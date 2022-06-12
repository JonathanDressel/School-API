**Contributors**
- Jonathan Dressel - dresselj@oregonstate.edu
- Kathleen Ashley - ashleyk@oregonstate.edu
- Ethan Barker - barkeret@oregonstate.edu
- Tanmay Badageri - badagert@oregonstate.edu

**Running the Program**
_1. Creating a network_

- docker network create --driver bridge finalnet

_2. Docker server_

- docker run -d --name finalserver --network finalnet -p "27017:27017" -e "MONGO_INITDB_ROOT_USERNAME=root" -e "MONGO_INITDB_ROOT_PASSWORD=hunter2" mongo:latest

_3. API server_

- docker run --rm -it --network finalnet mongo:latest mongo --host finalserver --username root --password hunter2 --authenticationDatabase admin
 
_4. Create a lower privilege user:_

> db.createUser({
... user:"root",
... pwd:"hunter2",
... roles: [{ role: "readWrite", db: "api" }]
... });
Successfully added user: {
	"user" : "root",
	"roles" : [
		{
			"role" : "readWrite",
			"db" : "api"
		}
	]
}
