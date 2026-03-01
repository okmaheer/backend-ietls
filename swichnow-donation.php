
1. Introduction	5
1.1 Purpose	5
2. System Flow	5
● 	5
3. Environment	6
3.1. Sandbox	6
3.2. Production	6
4. Security 	7
4.1. Bearer Token	7
● BearerAuth	7
● www-form-urlencoded object parameters:	7
● HTTP Error code:	8
5. Landing Page / PWA (GET)	9
5.1. Landing Page Calling Method	9
● Staging URL:	9
● Production URL:	9
5.2. Landing Page Parameters	9
● Parameters will be passed in the query string:	9
6. Landing Page / PWA (POST)	11
6.1. Landing Page Calling Method	11
● Staging URL:	11
● Production URL:	11
● Encryption:	11
6.2. Landing Page Parameters	11
● Parameters will be passed in the form body:	11
● Parameters will be in json object (which encrypt and used in token parameter above):	11
7. E-Wallet Payin API	13
7.1. API Calling Method	13
7.2. API URL	13
● JSON Object Parameters	13
● HTTP Error code:	15
8. Biller Payin API	16
8.1. API Calling Method	16
8.2. API URL	16
● JSON Object Parameters	16
● HTTP Error code:	17
9. Bank Payin APIs	19
9.1. Bank API	19
9.1.1. API Calling Method	19
9.1.2. API URL	19
● HTTP Error code:	19
9.2. Bank OTP API	20
9.2.1. API Calling Method	20
9.2.2. API URL	20
● JSON Object Parameters	20
● Example success response body:	21
● HTTP Error code:	22
9.3. Bank Transfer API	23
9.3.1. API Calling Method	23
9.3.2. API URL	23
● JSON Object Parameters	23
● HTTP Error code:	24
10. QR Payin APIs	26
10.1. QR Generate	26
10.1.1. API Calling Method	26
10.1.2. API URL	26
● JSON Object Parameters	26
● HTTP Error code:	28
10.2. QR Cancel	28
10.2.1. API Calling Method	28
10.2.2. API URL	28
● JSON Object Parameters	28
● HTTP Error code:	29
10.3. QR Inquire	29
10.3.1. API Calling Method	29
10.3.2. API URL	29
● JSON Object Parameters	29
● Example success response body:	30
● HTTP Error code:	30
11. RTP	31
11.1. RTP Title	31
11.1.1. API Calling Method	31
11.1.2. API URL	31
● Query String Parameters	31
● Example success response body:	31
● HTTP Error code:	32
11.2. RTP Now Bank List	33
11.2.1. API Calling Method	33
11.2.2. API URL	33
● HTTP Error code:	33
11.3. RTP Now	34
11.3.1. API Calling Method	34
11.3.2. API URL	34
● JSON Body Parameters	34
● Example success response body:	35
● HTTP Error code:	36
11.4. RTP Later Bank List	36
11.4.1. API Calling Method	36
11.4.2. API URL	36
● HTTP Error code:	37
11.5. RTP Later	37
11.5.1. API Calling Method	37
11.5.2. API URL	37
● JSON Body Parameters	37
● Example success response body:	38
● HTTP Error code:	39
11.6. RTP Cancel	40
11.6.1. API Calling Method	40
11.6.2. API URL	40
● JSON Object Parameters	40
● HTTP Error code:	40
12. RTP Inquire	42
12.1. API Calling Method	42
12.2. API URL	42
● JSON Object Parameters	42
● Example success response body:	42
● HTTP Error code:	42
13. Inquire API	44
13.1. API Calling Method	44
13.2. API URL	44
● Query String Parameters	44
● Example success response body:	44
● Transaction Status:	44
● HTTP Error code:	45
14. Refund API	46
14.1. API Calling Method	46
14.2. API URL	46
● JSON Object Parameters	46
● Example success response body:	46
● HTTP Error code:	47
15. Recurring Card Payment	48
15.1. Step 1: Landing Page / PWA	48
● Parameter will be passed in the query string in case of Landing Page / PWA (GET) or in encrypted json object in case of Landing Page / PWA (POST) with other parameters (For other parameters see Landing Page / PWA):	48
15.2. Step 2: Get Instrument	48
15.2.1. API Calling Method	48
15.2.2. API URL	48
● Query Parameters	48
● Example response body:	48
15.3. Step 3: Initiate Recurring Payment	49
15.3.1. API Calling Method	49
15.3.2. API URL	49
● JSON Body Parameters	49
● Example response body:	50
16. Callback	51
17. Redirect the URL	52
18. Response Code	52






Introduction
Swich PayIn APIs are specifically designed to facilitate payment processing and make payment integration into your platform fast, secure, and seamless. A payment API secures user information for you and uses security like Bearer Token to minimize and eliminate security threats that could cost you.


Purpose
The purpose of this document is to give an overview of the Swich PayIn Landing page Interface and understand system flow.


System Flow
The flow of this system is smooth. Customers will Land on our Page and select the payment method. After filling in the form, the customer will submit the request. Now there are two scenarios, either it will be accepted, and the customer amount will be deducted from the customer’s account and informed to the merchant via callback.
























    Environment
Sandbox
There is a test environment available for integration development and testing, which simulates most of the requests and transaction types available in the platform. You can use this environment to ensure your requests are handled accordingly.
The base URL for development is: https://sandbox-api.swichnow.com

Production
After the testing phase is successful, you are ready to go live in the production environment.
The base URL for production is https://api.swichnow.com



















    Security 
      The Swich Payin API securely authenticates via a bearer token.
Bearer Token
To consume any API, you must use this API to access a token. If no authentication header is present or if the bearer token is invalid, the API will respond with HTTP 401 Unauthorized.
BearerAuth
Security scheme type
HTTP
HTTP Authorization Scheme
bearer


#
Name
Description
JSON Type
1
Security scheme type
An error message describing the general error.
String
2
HTTP Authorization Scheme
Human-readable description of the error. It can be used for debugging.
String


Sandbox Environment:
Use the following URL to get authentication Token
Request = POST: https://sandbox-auth.swichnow.com/connect/token

Production Environment:
Use the following URL to get authentication Token
Request  = POST: https://auth.swichnow.com/connect/token


www-form-urlencoded object parameters:
#
Key
Type
Mandatory
Description
1
grant_type
string
Yes
The grant type will always be “client_credentials”.it is a constant. 
2
client_id
string
Yes
Unique for every customer.


3
client_secret
string
Yes
Unique for every customer.




Example success response body:
{
    "access_token": "…",
    "token_type": "Bearer",
    "expires_in": 3600 // seconds
}


Example failed response body:
{
    "error": "invalid_client",
    "error_description": "The specified client credentials are invalid.",
    "error_uri": "https://documentation.openiddict.com/errors/ID2055"
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use incorrect client_id or client_secret.
2
400
Bad Request. For example, you would get this response if invalid values are provided in parameters or parameters are missing


3
500
An error occurred processing the call.





















Landing Page / PWA (GET)
Landing Page is a UI interface that is used to perform transactions through multiple payment methods.


Landing Page Calling Method
To call Swich PayIn GUI, one can call the HTTP GET URL within the application or via a browser with the required parameters. 
Staging URL:
https://sandbox-payin-pwa.swichnow.com/?clientId={clienti_id}&customerTransactionId={test}&item=test&amount=10&channel=0&billReferenceNo=test01&description=test&PayeeName=testuser&Email=test%40yopmail.com&MSISDN=03451234567&currency=PKR&checksum={checksum}&RecurringPaymentType=Auto&RecurringStartDateTime=7/28/2025%2012:00:00%20AM&RecurringEndDateTime=7/31/2025%2012:00:00%20AM&RecurringFrequency=5&RecurringSchedulerTime=12

Production URL:
https://payin-pwa.swichnow.com/?clientId={clienti_id}&customerTransactionId={test}&item=test&amount=10&channel=0&billReferenceNo=test01&description=test&PayeeName=testuser&Email=test%40yopmail.com&MSISDN=03451234567&currency=PKR&checksum={checksum}&RecurringPaymentType=Auto&RecurringStartDateTime=7/28/2025%2012:00:00%20AM&RecurringEndDateTime=7/31/2025%2012:00:00%20AM&RecurringFrequency=5&RecurringSchedulerTime=12


Landing Page Parameters
Parameters will be passed in the query string:


#
Key
Type
Mandatory
Description
1
clientid
string
Yes
Provided by Swich to each customer.
2
customertransactionid
string
Yes
Unique id for each transaction.  Maximum 50 characters are allowed.
3
item
string
Yes
Can be anything but doesn’t contain a special character. Maximum 500 characters are allowed.
4
amount
string
Yes
An amount greater than 10.00 PKR to 50000.00 PKR
5
channel
int
Yes
By default, it will remain 0
6
checksum
string
Yes
The formula for checksum is Swich:customer_transaction_id:item:amount
HMACSHA256 algorithm to get hash with the provided SecretKey
7
description
string
Yes
Purpose of transaction
8
billReferenceNo
string
Conditional
Reference number of a Bill to be paid (Mandatory in case of Bank Payment)
9
payeename
string
Yes
Name of a Person who is paying
10
email
string
Yes
Email of a Person who is paying
11
msisdn
string
Yes
Mobile number of a person who 
is paying
Preferred format “03xxxxxxxxx”
12
currency
string
No
The currency should be PKR or USD.
13
transactionType
string
Conditional
Swich will provide the values (Required in case of QR and RTP payment)
14
isRecurringPayment
bool
Conditional
Pass true in case of recurring payments.
In case of recurring card payments.
15
successRedirectUrl
string
No
If you want to redirect on a dynamic page then use this parameter otherwise Swich will configure the redirect page URL at their end.
16
recurringPaymentType
string
Conditional
Allowed values: None, Manual, Auto. If Auto, then the below 4 parameters are mandatory.
17
recurringStartDateTime
datetime
Conditional
Start date of auto-debit. Example: 2025-07-18T00:00:00
18
recurringEndDateTime
datetime
Conditional
End date of auto-debit. Example: 2025-07-26T00:00:00
19
recurringFrequency
int
Conditional
Number of days between each recurring payment (e.g., 1 for daily).
20
recurringSchedulerTime
string
Conditional
Time of day for auto-debit. Format: HH:mm (e.g., 14:00)



Landing Page / PWA (POST)
Landing Page is a UI interface that is used to perform transactions through multiple payment methods.
Landing Page Calling Method
To call Swich PayIn GUI, one can call the HTTP POST URL within the application or via a browser with the required parameters using form post. 
Staging URL:
https://sandbox-payinpwa20.swichnow.com/Transaction/Index
Production URL:
https://payin2pwa.swichnow.com/Transaction/Index
Encryption:
Aes encryption algorithm has been used. Keys will be shared by swich upon integration.

Landing Page Parameters
Parameters will be passed in the form body:
#
Key
Type
Mandatory
Description
1
ClientId
string
Yes
Provided by Swich to each customer.
2
Token
string
Yes
This will be an encrypted json object with parameters mentioned below.


Parameters will be in json object (which encrypt and used in token parameter above):


#
Key
Type
Mandatory
Description
1
ClientId
string
Yes
Provided by Swich to each customer.
2
CustomerTransactionId
string
Yes
Unique id for each transaction.  Maximum 50 characters are allowed.
3
Item
string
Yes
Can be anything but doesn’t contain a special character. Maximum 500 characters are allowed.
4
Amount
string
No
An amount greater than 10.00 PKR to 50000.00 PKR

If you want the user to put an amount then send this field null otherwise put the amount value.
5
Channel
int
Yes
By default, it will remain 0
6
Checksum
string
Yes
The formula for checksum is Swich:customer_transaction_id:item:amount
HMACSHA256 algorithm to get hash with the provided SecretKey
7
Description
string
Yes
Purpose of transaction
8
BillReferenceNo
string
Conditional
Reference number of a Bill to be paid (Mandatory in case of Bank Payment)
9
PayeeName
string
Yes
Name of a Person who is paying
10
Email
string
Yes
Email of a Person who is paying
11
MSISDN
string
Yes
Mobile number of a person who 
is paying
Preferred format “03xxxxxxxxx”
12
Currency
string
No
The currency should be PKR or USD.
13
TransactionType
string
Conditional
Swich will provide the values (Required in case of QR and RTP payment)
14
IsRecurringPayment
bool
Conditional
Pass true in case of recurring payments.
In case of recurring card payments.
15
SuccessRedirectUrl
string
No
If you want to redirect on a dynamic page then use this parameter otherwise Swich will configure the redirect page URL at their end.





E-Wallet Payin API
API Calling Method
To call E-Wallet API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
	Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/ewallet
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system generated transaction Id
2
categoryId
integer
Yes
It will be a ID of Payment option
3
channelId
integer
Yes
For Easypaisa, it will be 8. For JazzCash, it will be 10.. 
4
remoteIPAddress
string
No
It must be a whitelisted IP Address.
5
ucid
string
No
Any alphanumeric value but range will be 6
6
item
string
Yes
Any alphanumeric value
7
amount
decimal
Yes
Amount in PKR
8
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
9
cnic
string
No
CNIC of the customer without dashes and spaces. 
(Pass empty string in case if not passing value)
10
email
string
No
Email address of a customer.
(Pass empty string in case if not passing value)


Example success response body:
{
    "code": 0000,
    "status": "success",
    "transactionId": 0001,
    "orderId": "SW0001",
    "message": "Transaction has been done successfully",
    "timestamp": "2022-09-25T21:56:57.989Z"
}

Example failed response body:
If payment OTP not accepted:
{
    "transactionId": 1234,
    "orderId": "SW1234",
    "status": "failed",
    "code": "9900",
    "message": "OTP authentication failed",
    "timestamp": "2024-12-18T09:54:47.480Z",
    "channelResponse": ""
}


Duplicate CustomerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-18T05:50:26.127Z",
    "channelResponse": ""
}


If MSISDN is incorrect:
{
    "transactionId": 0,
    "orderId": "",
    "status": "failed",
    "code": "0008",
    "message": "PurchaseAPIController > [ Parameter [MSISDN] has invalid value: [9323232323] ]",
    "timestamp": "2024-12-18T05:51:13.517Z",
    "channelResponse": ""
}


If Invalid amount passed:
{
    "transactionId": 0,
    "orderId": "",
    "consumerNumber": "",
    "status": "failed",
    "code": "00012",
    "message": "Transaction failed, Transaction amount is less than allowed minimum amount",
    "timestamp": "2024-12-18T05:57:17.085Z",
    "channelResponse": ""
}


If channel is not allowed:
{
    "transactionId": 0,
    "orderId": "",
    "consumerNumber": "",
    "status": "failed",
    "code": "0018",
    "message": "Transaction failed, The channel is not allowed to category by the merchant",
    "timestamp": "2024-12-19T11:22:36.254Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.





















Biller Payin API
API Calling Method
To call 1Bill API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
	Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/biller
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system generated transaction Id
2
categoryId
integer
Yes
for 1Bill, it will be 3
3
channelId
integer
Yes
Channel Id for 1Bill always remain 11 
4
remoteIPAddress
string
No
It must be a whitelisted IP Address.
5
ucid
string
No
Any alphanumeric value but range will be 6
6
item
string
Yes
Any alphanumeric value
7
amount
number
Yes
Amount in PKE
8
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
9
cnic
string
No
CNIC of the customer without dashes and spaces.
(Pass empty string in case if not passing value)
10
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)


Example success response body:
{
    "code": 0000,
    "status": "success",
    "transactionId": 0001,
    "orderId": "SW0001",
    "message": "Transaction has been created successfully",
    "consumerNumber": "0000000000000000000000000",
    "timestamp": "2022-09-25T21:56:57.989Z"
}
Example failed response body:
Duplicate CustomerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-18T05:50:26.127Z",
    "channelResponse": ""
}


If MSISDN is incorrect:
{
    "transactionId": 0,
    "orderId": "",
    "status": "failed",
    "code": "0008",
    "message": "PurchaseAPIController > [ Parameter [MSISDN] has invalid value: [9323232323] ]",
    "timestamp": "2024-12-18T05:51:13.517Z",
    "channelResponse": ""
}


If Invalid amount passed:
{
    "transactionId": 0,
    "orderId": "",
    "consumerNumber": "",
    "status": "failed",
    "code": "00012",
    "message": "Transaction failed, Transaction amount is less than allowed minimum amount",
    "timestamp": "2024-12-18T05:57:17.085Z",
    "channelResponse": ""
}


If channel is not allowed:
{
    "transactionId": 0,
    "orderId": "",
    "consumerNumber": "",
    "status": "failed",
    "code": "0018",
    "message": "Transaction failed, The channel is not allowed to category by the merchant",
    "timestamp": "2024-12-19T11:22:36.254Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.

























Bank Payin APIs
 Bank API
 API Calling Method
To call Bank  API, you can call the HTTP GET URL within an application or via a browser with the required parameters.
 API URL
	Request = GET: https://{base_url}/gateway/payin/get/banks
Example success response body:
{
    "data": [
        {
            "name": "Test Bank",
            "code": "TBANK"
        }
        {
            "name": "Bank Alfalah",
            "code": "BAFL"
        }
    ],
    "banksResult": null,
    "status": "success",
    "code": "0000",
    "message": "Banks fetched successfully!",
    "timestamp": "2024-02-15T07:51:25.654Z",
    "channelResponse": null
} 

Example failed response body:
If API failed to get data:
{
    "data": null,
    "banksResult": null,
    "status": "success",
    "code": "9900",
    "message": "Banks fetched failed!",
    "timestamp": "2024-12-19T11:30:44.475Z",
    "channelResponse": ""
}



HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


Bank OTP API
 API Calling Method
To call a Bank OTP API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
 API URL
	Request = POST: https://{base_url}/gateway/payin/v2.0/bank/otp
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system generated transaction Id
2
bankCode
string
Yes
Bank code of selected bank
3
description
string
Yes
Description of purchase
4
item
string
Yes
Any alphanumeric value
5
amount
number
Yes
Amount in PKR
6
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
7
cnic
string
Yes
CNIC of the customer without dashes and spaces
(Pass empty string in case if not passing value)
8
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)
9

billReferenceNo
string
Yes
Reference number of a Bill to be paid
10

consumerName
string
Yes
Consumer name of a person paying the bill
11
accountNo


string
Yes
Account number of person who is using the service


Example success response body:
{
    "transactionId": 22,
    "orderId": "SW22",
    "accountNo": "99510103302635",
    "amount": 10,
    "channelResponse": "",
    "billReferenceNo": "",
    "transactionReferenceNo": "57b8xxxx-xxxx-xxxx-xxxx-xxxxxxxxa547",
    "retreivalReferenceNo": "57b8xxxx-xxxx-xxxx-xxxx-xxxxxxxxa547",
    "rdvMessageKey": null,
    "discountAmount": null,
    "isTransactionCompleted": false,
    "status": "success",
    "code": "0000",
    "message": "OTP has been send successfully!",
    "timestamp": "2023-01-01T11:03:39.762Z"
}

Example failed response body:
Duplicate CustomerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "accountNo": "11111111111111",
    "amount": 0,
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "discountAmount": null,
    "isTransactionCompleted": false,
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-19T11:34:29.382Z",
    "channelResponse": ""
}


If MSISDN is incorrect:
{
    "transactionId": 0,
    "orderId": "",
    "accountNo": "",
    "amount": 0,
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "discountAmount": null,
    "isTransactionCompleted": false,
    "status": "failed",
    "code": "0008",
    "message": "MSISDN is required",
    "timestamp": "2024-12-19T11:35:11.327Z",
    "channelResponse": ""
}


If Invalid amount passed:
{
    "transactionId": 0,
    "orderId": "",
    "accountNo": "11111111111111",
    "amount": 0,
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "discountAmount": null,
    "isTransactionCompleted": false,
    "status": "failed",
    "code": "0013",
    "message": "Transaction failed, Transaction amount is greater than allowed maximum amount",
    "timestamp": "2024-12-19T11:35:43.412Z",
    "channelResponse": ""
}


Failed at vendor side:
{
    "transactionId": 27453,
    "orderId": "SW27453",
    "accountNo": "11111111111111",
    "amount": 0,
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "discountAmount": null,
    "isTransactionCompleted": false,
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side > [ No Response from Server ]",
    "timestamp": "2024-12-19T11:37:02.812Z",
    "channelResponse": ""
}



HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


Bank Transfer API
 API Calling Method
To call Bank Transfer API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
 API URL
	Request = POST: https://{base_url}/gateway/payin/v2.0/bank/transfer
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system generated transaction Id
2
transactionId
integer
Yes
Transaction Id received in the response of Bank OTP
3
orderId
string
Yes
Order Id received in the response of Bank OTP
4

billReferenceNo
string
Yes
Same as sent in Bank OTP 
5
transactionReferenceNo
string
Yes
Received in the response of Bank OTP
6
retreivalReferenceNo
string
Yes
Received in the response of Bank OTP
7
otp
string
Yes
Received from bank


Example success response body:
{
    "transactionId": 22,
    "orderId": "SW22",
    "amount": 10,
    "currency": "PK",
    "billReferenceNo": "8524",
    "transactionReferenceNo": "57b8xxxx-xxxx-xxxx-xxxx-xxxxxxxxa547",
    "retreivalReferenceNo": "57b8xxxx-xxxx-xxxx-xxxx-xxxxxxxxa547",
    "rdvMessageKey": null,
    "statusCode": null,
    "statusMsg": null,
    "vendorCode": null,
    "channelResponse": "",
    "status": "success",
    "code": "0000",
    "message": "Transaction has been created successfully",
    "timestamp": "2023-01-01T11:11:06.761Z"
}




Example failed response body:
Invalid OTP:
{
    "transactionId": 27454,
    "orderId": "SW27454",
    "amount": 10.0000,
    "currency": "",
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "statusCode": null,
    "statusMsg": null,
    "vendorCode": null,
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side > [ You have entered an invalid OTP ]",
    "timestamp": "2024-12-19T12:24:39.373Z",
    "channelResponse": ""
}

Invalid transactionReferenceNo, retreivalReferenceNo, orderId, transactionId:
{
    "transactionId": 0,
    "orderId": null,
    "amount": 0,
    "currency": "",
    "billReferenceNo": "",
    "transactionReferenceNo": "",
    "retreivalReferenceNo": "",
    "rdvMessageKey": null,
    "statusCode": null,
    "statusMsg": null,
    "vendorCode": null,
    "status": "failed",
    "code": "0007",
    "message": "Transaction failed, No record found against provided data",
    "timestamp": "2024-12-19T12:29:46.664Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.























QR Payin APIs
 QR Generate
API Calling Method
To call Generate QR API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/qr/dynamic
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system-generated transaction Id
2
billReferenceNo
string
No
Reference number of a Bill to be paid
3
name
string
Yes
Name of a person who is paying
4
transactionType
string
Yes
Shared by SWICH
5
amount
decimal
Yes
Amount in  PKR
6
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
7
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)
8
cnic
string
No
CNIC of the customer without dashes and spaces.
(Pass empty string in case if not passing value)
9
currency
string
No
Default value is PKR


Example success response body:
{
    "transactionId": 24106,
    "orderId": "SW24106",
    "qrString": "0002010102122863001924072612134486351450108ONELINKG0224PK52AIIN0000102287422015520454115303586540450.05802PK5905Swich6007KARACHI6227031500000000000000207040001846300192407261213448646026013693c11680-d564-4565-85a1-dbc84acbe7378534001924072612134486467160107KARACHI63042AC4",
    "stan": "658068",
    "retrievalNo": "000190598279",
    "expireAt": "2022-07-26T12:33:42.4489377+05:00",
    "status": "success",
    "code": "0000",
    "message": "QR generated successfully",
    "timestamp": "2022-07-26T07:13:42.453Z"
}

Example failed response body:
Duplicate CustomerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "qrString": null,
    "expireAt": null,
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-19T13:35:59.188Z",
    "channelResponse": ""
}


If transactionType is incorrect:
{
    "transactionId": 0,
    "orderId": "",
    "qrString": null,
    "expireAt": null,
    "status": "failed",
    "code": "0007",
    "message": "Transaction type is not allowed to customer",
    "timestamp": "2024-12-19T13:37:21.269Z",
    "channelResponse": ""
}


When amount is less than fee amount
{
    "transactionId": 27413,
    "orderId": "SW27413",
    "qrString": null,
    "expireAt": null,
    "status": "failed",
    "code": "9900",
    "message": "Transaction failed, Response Code: 44 with Response Desc: Transaction amount should be greater than fee value",
    "timestamp": "2024-12-18T06:11:58.411Z",
    "channelResponse": ""
}


If route is not configured:
{
    "transactionId": 0,
    "orderId": "",
    "qrString": null,
    "expireAt": null,
    "status": "failed",
    "code": "0007",
    "message": "No vendor credentials found for customer.",
    "timestamp": "2024-12-19T13:35:17.514Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


QR Cancel
API Calling Method
To call a Cancel QR API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/qr/dynamic/cancel
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system-generated transaction Id


Example response body:
{
    "status": "success",
    "code": "0000",
    "message": "Transaction canceled successfully",
    "timestamp": "2022-07-26T07:34:29.435Z"
}



Example failed response body:
If invalid customerTransactionId:
{
    "status": "failed",
    "code": "0007",
    "message": "No transaction found",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}



If failed at vendor:
{
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


QR Inquire
API Calling Method
To call an Inquire QR API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/qr/dynamic/inquire
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system-generated transaction Id


Example success response body:
{
    "paymentStatus": "RTP Accepted",
    "status": "success",
    "code": "0000",
    "message": "Transaction inquire successfully",
    "timestamp": "2022-07-26T07:48:29.237Z",
}

Example failed response body:
If invalid customerTransactionId:
{
    "paymentStatus": null,
    "status": "failed",
    "code": "0007",
    "message": "No transaction found",
    "timestamp": "2024-12-19T13:47:21.469Z",
    "channelResponse": ""
}






If failed at vendor:
{
    "paymentStatus": null,
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:47:21.469Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.



RTP
RTP Title
API Calling Method
To call RTP Title API, you can call the HTTP GET URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = GET: https://{base_url}/gateway/payin/v2.0/purchase/rtp/title
Query String Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId 
string
Yes
Customer system-generated transaction Id
2
bankCode
string
Yes
Fetch from RTP Now Bank List / RTP Later Bank List API
3
accountNumber
string
Conditional
Mandatory in case if customer uses account number for transaction
4
accountNumberAlias
string
Conditional
Mandatory in case if customer uses RAAST ID for transaction
5
transactionType 
string
Yes
Shared by SWICH
6
billReferenceNo
string
No
Reference number of a Bill to be paid


Example success response body:
{
    "title": "New",
    "type": null,
    "expiry": "2024-08-07T09:17:59",
    "rtpId": "ef38615a-229c-4ce6-ab91-aac65f5bb6a3",
    "status": "success",
    "code": "0000",
    "message": "Title fetched successfully",
    "timestamp": "2024-07-26T14:31:19.889Z",
    "channelResponse": ""
}





Example failed response body:
If invalid accountNumber or accountNumberAlias:
{
    "title": null,
    "type": null,
    "expiry": null,
    "rtpId": null,
    "status": "failed",
    "code": "9900",
    "message": "Title fetch failed",
    "timestamp": "2024-12-19T13:56:57.748Z",
    "channelResponse": ""
}


If invalid transactionType:
{
    "title": null,
    "type": null,
    "expiry": null,
    "rtpId": null,
    "status": "failed",
    "code": "0007",
    "message": "Transaction type is not allowed to customer",
    "timestamp": "2024-12-19T13:58:23.988Z",
    "channelResponse": ""
}



HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.





RTP Now Bank List
API Calling Method
To call RTP Now Bank API, you can call the HTTP GET URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = GET: https://{base_url}/gateway/payin/v2.0/rtp/now/get/banks
Example success response body:
{
    "data": [
        {
            "name": "National Bank Of Pakistan",
            "code": "NBPB"
        },
        {
            "name": "Bank Alfalah",
            "code": "BAFL"
        }
    ],
    "banksResult": null,
    "status": "success",
    "code": "0000",
    "message": "Banks fetched successfully!",
    "timestamp": "2024-07-29T06:57:19.759Z",
    "channelResponse": ""
}

Example failed response body:
If API failed:
{
    "data": null,
    "banksResult": null,
    "status": "success",
    "code": "0000",
    "message": "Banks fetched failed!",
    "timestamp": "2024-07-29T06:57:19.759Z",
    "channelResponse": ""
}







HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


RTP Now
API Calling Method
To call an RTP Now API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/rtp/now
JSON Body Parameters
#
Key
Type
Mandatory
Description
1
CustomerTransactionId
string
Yes
Customer system-generated transaction Id
2
billReferenceNo
string
No
Reference number of a Bill to be paid
3
bankCode
string
Yes
Fetch from RTP Now Bank List API
4
accountTitle
string
Yes
Fetch from RTP Title API
5
accountNumber
string
Conditional
Mandatory in case if customer uses account number for transaction
6
accountNumberAlias
string
Conditional
Mandatory in case if customer uses RAAST ID for transaction
7
transactionType
string
Yes
Shared by SWICH
8
name
string
Yes
Name of a person who is paying
9
amount
decimal
Yes
Amount in  PKR
10
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
11
rtpId
string
Yes
Received in the response of RTP Title API
12
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)
13
cnic
string
No
CNIC of the customer without dashes and spaces.
(Pass empty string in case if not passing value)
14
currency
string
No
Default value is PKR


Example success response body:
{
    "transactionId": 24170,
    "orderId": "SW24170",
    "stan": "418101",
    "retrievalNo": "603525328939",
    "expireAt": "2024-07-29T12:32:53.2714824+05:00",
    "status": "success",
    "code": "0000",
    "message": "RTP request initiated",
    "timestamp": "2022-07-29T07:13:13.263Z"
}

Example failed response body:
Duplicate customerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "stan": null,
    "retrievalNo": null,
    "expireAt": null,
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-19T14:01:25.572Z",
    "channelResponse": ""
}


If invalid bankCode or accountNumber or accountNumberAlias:
{
    "transactionId": 27469,
    "orderId": "SW27469",
    "stan": null,
    "retrievalNo": null,
    "expireAt": null,
    "status": "failed",
    "code": "9900",
    "message": "Transaction failed, Transaction failed, your provided account details are invalid",
    "timestamp": "2024-12-19T14:03:46.121Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


RTP Later Bank List
API Calling Method
To call RTP Now Bank API, you can call the HTTP GET URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = GET: https://{base_url}/gateway/payin/v2.0/rtp/later/get/banks
Example success response body:
{
    "data": [
        {
            "name": "National Bank Of Pakistan",
            "code": "NBPB"
        },
        {
            "name": "Bank Alfalah",
            "code": "BAFL"
        }
    ],
    "banksResult": null,
    "status": "success",
    "code": "0000",
    "message": "Banks fetched successfully!",
    "timestamp": "2024-07-29T06:57:19.759Z",
    "channelResponse": ""
}




Example failed response body:
If API failed:
{
    "data": null,
    "banksResult": null,
    "status": "success",
    "code": "0000",
    "message": "Banks fetched failed!",
    "timestamp": "2024-07-29T06:57:19.759Z",
    "channelResponse": ""
}





HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.


RTP Later
API Calling Method
To call an RTP Later API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory. This will generate RTP which starts in future time.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/rtp/later
JSON Body Parameters
#
Key
Type
Mandatory
Description
1
CustomerTransactionId
string
Yes
Customer system-generated transaction Id
2
billReferenceNo
string
No
Reference number of a Bill to be paid
3
bankCode
string
Yes
Fetch from RTP Later Bank List API
4
accountTitle
string
Yes
Fetch from RTP Title API
5
accountNumber
string
Conditional
Mandatory in case if customer uses account number for transaction
6
accountNumberAlias
string
Conditional
Mandatory in case if customer uses RAAST ID for transaction
7
transactionType
string
Yes
Shared by SWICH
8
name
string
Yes
Name of a person who is paying
9
amount
decimal
Yes
Amount in  PKR
10
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
11
rtpId
string
Yes
Received in the response of RTP Title API
12
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)
13
cnic
string
No
CNIC of the customer without dashes and spaces.
(Pass empty string in case if not passing value)
14
currency
string
No
Default value is PKR

Example success response body:
{
    "transactionId": 24172,
    "orderId": "SW24172",
    "stan": "447979",
    "retrievalNo": "990924563694",
    "expireAt": "2024-07-30T12:38:53.0005375+05:00",
    "status": "success",
    "code": "0000",
    "message": "RTP request initiated",
    "timestamp": "2024-07-29T07:19:13.006Z"
}




Example failed response body:
Duplicate customerTransactionId:
{
    "transactionId": 0,
    "orderId": "",
    "stan": null,
    "retrievalNo": null,
    "expireAt": null,
    "status": "failed",
    "code": "0001",
    "message": "Transaction failed, duplicate customer transaction id",
    "timestamp": "2024-12-19T14:11:55.962Z",
    "channelResponse": ""
}


If invalid bankCode or accountNumber or accountNumberAlias:
{
    "transactionId": 27474,
    "orderId": "SW27474",
    "stan": null,
    "retrievalNo": null,
    "expireAt": null,
    "status": "failed",
    "code": "9900",
    "message": "Transaction failed, Transaction failed, your provided account details are invalid",
    "timestamp": "2024-12-19T14:12:25.733Z",
    "channelResponse": ""
}
HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.




RTP Cancel
API Calling Method
To call an RTP Cancel API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/rtp/cancel
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
CustomerTransactionId
string
Yes
Customer system-generated transaction Id


Example success response body:
{
    "status": "success",
    "code": "0000",
    "message": "RTP canceled successfully",
    "timestamp": "2024-07-29T07:34:57.555Z"
}

Example failed response body:
If invalid customerTransactionId:
{
    "status": "failed",
    "code": "0007",
    "message": "No transaction found",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}


If failed at vendor:
{
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.



























RTP Inquire
API Calling Method
To call an RTP Inquire API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/rtp/inquire
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
CustomerTransactionId
string
Yes
Customer system-generated transaction Id


Example success response body:
{
    "paymentStatus": "RTP Accepted",
    "status": "success",
    "code": "0000",
    "message": "success",
    "timestamp": "2024-07-29T08:29:38.974Z"
}

Example failed response body:
If invalid customerTransactionId:
{
    "paymentStatus": null,
    "status": "failed",
    "code": "9900",
    "message": "Transaction not found",
    "timestamp": "2024-12-19T14:15:40.252Z",
    "channelResponse": ""
}


If failed at vendor:
{
    "paymentStatus": null,
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.



























Inquire API
API Calling Method
To call Inquire API, you can call the HTTP GET URL with the required parameters.
API URL
	Request = GET: https://{base_url}/gateway/payin/v2.0/inquire
Query String Parameters
#
Key
Type
Mandatory
Description
1
CustomerTransactionId
string
Yes
Customer system-generated transaction Id


Example success response body:
{
"transaction": {
        "id": 438,
        "orderId": "SW438",
        "categoryName": "EWallet",
        "channelName": "EasyPaisa",
        "item": "test",
        "amount": 1.0000,
        "msisdn": "03411111111",
        "email": "test@test.com",
        "cnic": "4230189893684",
        "transactionStatus": "success",
        "channelTransactionId": "19605816379",
        "channelResponseDateTime": "2022-12-21T11:28:16.6433333",
        "createdDateTime": "2022-12-21T11:28:05.8233333",
        "consumerNumber": ""
},
    "status": "success",
    "code": "0000",
    "message": "Transaction inquire successfully",
     "timestamp": "2022-12-21T06:28:05.823Z"
}


Transaction Status:
pending,
queue,
success,
failed,
block,
terminated,
dispute,
otp send,
refund,
partial refund

Example failed response body:
If invalid customerTransactionId:
{
    "transaction": null,
    "status": "failed",
    "code": "00012",
    "message": "Transaction failed, 00012",
    "timestamp": "2024-12-19T14:20:05.693Z",
    "channelResponse": ""
}




If failed at vendor:
{
    "transaction": null,
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}

HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.










Refund API
API Calling Method
To call Refund API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
Note: Refund is allowed for selected payment methods.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/refund
JSON Object Parameters
#
Key
Type
Mandatory
Description
1
OrderId
string
Yes
Swich order id
2
Reason
string
Yes
Refund reason (max length 500)
3
Amount
decimal
Yes
Amount in PKR.

Refund amount can be equal to transaction amount or less than the transaction amount.

Refunds with less than transaction amount will be recorded as partial refunds.


Example success response body:
{
    "status": "success",
    "code": "0000",
    "message": "Transaction has been refund successfully",
    "timestamp": "2024-07-29T08:29:38.974Z"
}

Example failed response body:
If invalid orderId:
{
    "status": "failed",
    "code": "0007",
    "message": "No transaction found",
    "timestamp": "2024-12-19T14:23:49.248Z",
    "channelResponse": ""
}


If failed at vendor:
{
    "status": "failed",
    "code": "9900",
    "message": "Failed at vendor side",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}

If no refund policy applied:
{
    "status": "failed",
    "code": "0009",
    "message": "Transaction is invalid for refund",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}


If refund amount is greater than actual amount:
{
    "status": "failed",
    "code": "0014",
    "message": "Refund amount cannot be greater than transaction amount",
    "timestamp": "2024-12-19T13:42:22.534Z",
    "channelResponse": ""
}



HTTP Error code:
#
Key
Description
1
200
OK.
1
401
Unauthorized. For example, you would get this response if you use expired token or no token
2
400
Bad Request. For example, you would get this response if invalid values are provided in request or system validation fails or receives a failed response from the vendor side.
3
500
An error occurred processing the call.
4
502
Bad Gateway. For example, you are unable to reach our gateway.











Recurring Card Payment
Step 1: Landing Page / PWA
Initiate recurring payment request using Landing Page / PWA with parameter isRecurringPayment having value true.
Parameter will be passed in the query string in case of Landing Page / PWA (GET) or in encrypted json object in case of Landing Page / PWA (POST) with other parameters (For other parameters see Landing Page / PWA):


#
Key
Type
Mandatory
Description
1
isRecurringPayment
bool
Yes
Pass true in case of recurring payments
2
recurringPaymentType
string
Conditional
Allowed values: None, Manual, Auto. If Auto, then the below 4 parameters are mandatory.
3
recurringStartDateTime
datetime
Conditional
Start date of auto-debit. Example: 2025-07-18T00:00:00
4
recurringEndDateTime
datetime
Conditional
End date of auto-debit. Example: 2025-07-26T00:00:00
5
recurringFrequency
int
Conditional
Number of days between each recurring payment (e.g., 1 for daily).
6
recurringSchedulerTime
string
Conditional
Time of day for auto-debit. Format: HH:mm (e.g., 14:00)


For future payments there will be no need for Step 1 if payment is processed successfully at Step 1, you can continue from Step 2.

Step 2: Get Instrument
API Calling Method
To call Get Instrument API, you can call the HTTP GET URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = GET: https://{base_url}/gateway/payin/v2.0/purchase/card/recurring/instrument
Query Parameters
#
Key
Type
Mandatory
Description
1
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”
Swich stores recurring payment token against MSISDN which has been passed when registering for recurring payment in Step 1


Example response body:
{
    "status": "success",
    "code": "0000",
    "message": "Transaction has been successfully intiated",
    "timestamp": "2024-07-29T08:29:38.974Z",
    "instrumentToken": "<instrument token>",
    "msisdn": "03000000000"
}

Step 3: Initiate Recurring Payment
API Calling Method
To call Initiate Recurring Payment API, you can call the HTTP POST URL with the required parameters. To consume this API, IP whitelisting is mandatory.
API URL
Request = POST: https://{base_url}/gateway/payin/v2.0/purchase/card/recurring
JSON Body Parameters
#
Key
Type
Mandatory
Description
1
customerTransactionId
string
Yes
Customer system-generated transaction Id
2
billReferenceNo
string
No
Reference number of a Bill to be paid
3
item
string
Yes
Any alphanumeric value
4
name
string
Yes
Name of a person who is paying
5
amount
decimal
Yes
Amount in  PKR
6
msisdn
string
Yes
Mobile Number of the customer. Preferred format “03xxxxxxxxx”.
Same as Get Instrument MSISDN.
7
instrumentToken
string
Yes
Received from Get Instrument API.
8
email
string
No
Email address of a customer
(Pass empty string in case if not passing value)
9
cnic
string
No
CNIC of the customer without dashes and spaces.
(Pass empty string in case if not passing value)
10
currency
string
No
Default value is PKR






Example response body:
{
    "transactionId": 24106,
    "orderId": "SW24106",
    "status": "success",
    "code": "0000",
    "message": "Transaction has been done successfully",
    "timestamp": "2024-07-29T08:29:38.974Z",
}

