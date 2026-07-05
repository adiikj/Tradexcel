import dotenv from 'dotenv';
import express from 'express';
import connectDB from './db/index.js';
import { app } from './app.js';
import { startContestSettlementJob } from './jobs/contestSettlement.js';
import { startAlertCheckerJob } from './jobs/alertChecker.js';

if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config({ path: './.env' });
}

connectDB()
.then(()=>{
    const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });

    server.on("error", (error) => {
        console.log('Error:', error);
        throw error;
    });

    startContestSettlementJob();
    startAlertCheckerJob();

})
.catch((error)=>{
    console.log('Error:', error);
    throw error;
})

