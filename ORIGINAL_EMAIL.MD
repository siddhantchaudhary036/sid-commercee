Hey Siddhant,

PFA a short task description:

You will be building a full-stack agentic AI application that is a subset of the features required to maintain a Customer Data Platform for email marketing for e-commerce brands. You must fulfill the following requirements:
1. Customer information storage system - including email, phone number, name, etc. (part of this task is to come up with useful properties to store for a customer of an e-commerce brand).
2. UI to showcase all customers + corresponding information. Basic CRUD on this data should be built-in to the API.
3. Ability to perform CRUD operations on customer segments (a segment is defined as a subset of the overall set of customers, created based on a definition over one or more properties: ex - all customers whose shipping address is within the state of Texas, all customers whose email is suffixed with 'gmail.com' and who have ordered over $100 from the store within the last 6 months)
4. Ability to create flows - multi-step sequences of emails with delays (i.e. send email 1, wait 10 days, send email 2, wait 3 days, ...)
5. A simple AI agent that can generate segments and elements of a campaign given a prompt
Example:
Input:
I want to improve revenue from high LTV customers that haven't purchased recently.
Fully AI-assistant generated Output:
Segment: customers with LTV > 75th percentile across customers, actively subscribed to email marketing, have not ordered in last 60 days
Campaign: 
Subject: <generated subject>
Send-Time: <generated send time>
Send-Date: <generated send date>
Plain-text ideas on what to write (can use internet, can use simple dummy product data, etc.)


5. Explanation of the production setup for an email marketing software -> design this system in concept and outline implementation details. This part of the interview will be done purely on-call, feel free to prepare in advance.

IMPORTANT
Remember, please do not go overboard with UI, an over-engineered database, etc. Having benchmarked time for completion, this task is expected to take you no longer than a few (3-5) hours of time in total. If you find yourself spending longer than that, that may be a good signal of over-engineering. The idea behind this problem is to test a few main things:
1. speed of execution while maintaining a functioning solution
2. ability to balance code quality with aforementioned speed
3. most importantly: ability to add your own, independent thinking to the designed problem - *do not simply follow along and assume that you have completed everything, think about what may not be present within the problem design and how it may be relevant*


Ideally, we will follow up on this assignment within the next 48 hours (starting tomorrow morning), but please let me know if you have exams/other commitments that may not allow you to start immediately!

Looking forward to seeing what you can come up with,

Thanks,
Yash