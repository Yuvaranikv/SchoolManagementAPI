const express=require('express');
const bodyParser=require('body-parser');
const dotenv=require('dotenv');
const mysql=require('mysql2');
const geolib=require('geolib');

dotenv.config();

const app=express();
const port=8080;

app.use(bodyParser.json());

const db=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
});

db.connect((err)=>{
    if(err)
    {
        console.error('Database connection failed:',err.message);
    }else{
        console.log('connected to mysql database');
    }
});

app.get('/',(req,res)=>{
    return res.status(200).json({message:'welcome'});
});

app.post('/addSchool',(req,res)=>{
    const {name,address,latitude,longitude}=req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({message:'All fields are required'});

    }

    const query=`Insert into schools(name,address,latitude,longitude)values(?,?,?,?)`;
    db.query(query,[name,address,latitude,longitude],(err,result)=>{
        if(err){
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(201).json({message:'School added successfully',schoolId: result.insertId });
    });

});

app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Check if latitude and longitude are provided
    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Fetch all schools from the database
    const query = 'SELECT * FROM schools';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        // Convert latitude and longitude to numbers
        const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

        // Calculate distance for each school
        const schoolsWithDistance = results.map(school => {
            const schoolLocation = { latitude: school.latitude, longitude: school.longitude };

            // Calculate distance using geolib
            const distance = geolib.getDistance(userLocation, schoolLocation) / 1000; // in kilometers

            return { 
                ...school, 
                distance 
            };
        });

        // Sort schools by distance
        schoolsWithDistance.sort((a, b) => a.distance - b.distance);

        // Return the sorted list of schools
        res.status(200).json(schoolsWithDistance);
    });
});
app.listen(port,()=>{console.log(`Server running on http://localhost:8080`);

});
