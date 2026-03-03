# 🎯 Azure Deployment - Pre-Deployment Checklist

## ✅ Before You Deploy

### 1. **Azure Prerequisites**
- [ ] Azure CLI installed and working (`az version`)
- [ ] Logged into Azure account (sulaima1021@live.com)
- [ ] Subscription accessible (cb786cbf-fcdf-4348-af60-abed12bf7e17)
- [ ] Have at least $100/month available in subscription budget

### 2. **Local Environment**
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm packages installed (`npm install`)
- [ ] PowerShell 5.1+ available
- [ ] In project directory: `D:\git\StockWiseInvest`

### 3. **Configuration Files**
- [ ] `.env` file exists with all API keys:
  - [ ] GROQ_API_KEY present
  - [ ] FINNHUB_API_KEY present
  - [ ] HUGGINGFACE_API_KEY present
- [ ] `package.json` has correct dependencies
- [ ] `stockpredict/requirements.txt` complete

### 4. **Code Ready**
- [ ] Latest code committed to Git (optional but recommended)
- [ ] Application builds locally without errors
- [ ] All tests passing (if applicable)

---

## 🚀 Deployment Steps

### Phase 1: Infrastructure Deployment (5-10 minutes)

```powershell
cd D:\git\StockWiseInvest
.\azure\deploy-infrastructure.ps1
```

**Expected output:**
```
✓ Azure CLI version: X.X.X
✓ Current subscription: [Your subscription name]
✓ Resource group created
✓ Azure resources deployed successfully!
```

**What gets created:**
- [ ] Resource group: `rg-stockwiseinvest-prod`
- [ ] App Service Plan (Linux B2)
- [ ] Web App (Node.js)
- [ ] ML App (Python)
- [ ] Function App
- [ ] SQL Server + Database
- [ ] Storage Account
- [ ] Key Vault
- [ ] Application Insights

**Verify:**
- [ ] Check Azure Portal: https://portal.azure.com
- [ ] Navigate to resource group
- [ ] See all 10 resources listed
- [ ] No deployment errors shown

---

### Phase 2: Application Deployment (10-15 minutes)

```powershell
.\azure\deploy-apps.ps1
```

**Expected output:**
```
✓ Main application built successfully
✓ Deployment package created
✓ Main web app deployed successfully!
✓ ML backend deployed successfully!
```

**What gets deployed:**
- [ ] React frontend (built)
- [ ] Express backend (built)
- [ ] Node.js dependencies
- [ ] FastAPI ML backend
- [ ] Python dependencies
- [ ] ML models

**Verify:**
- [ ] Open web app URL in browser
- [ ] See StockWiseInvest dashboard load
- [ ] Check ML backend: `<ml-url>/health`
- [ ] Should return: `{"status": "healthy"}`

---

### Phase 3: Function Deployment (5 minutes)

```powershell
.\azure\deploy-function.ps1
```

**Expected output:**
```
✓ Function package prepared
✓ Function deployed successfully!
✓ Function settings configured
```

**What gets deployed:**
- [ ] Timer trigger function (2x daily)
- [ ] ML backend modules copied
- [ ] Python dependencies installed
- [ ] Database connection configured

**Verify:**
- [ ] Trigger manual update:
  ```powershell
  $info = Get-Content .\azure\deployment-info.json | ConvertFrom-Json
  curl -X POST "$($info.FunctionAppUrl)/api/manual-update"
  ```
- [ ] Should return: `{"status": "success", ...}`
- [ ] Check function logs in Azure Portal
- [ ] Verify database updated with new data

---

## ✅ Post-Deployment Verification

### 1. **Test Web Application**
- [ ] Visit web app URL
- [ ] Dashboard loads successfully
- [ ] Stock recommendations visible
- [ ] Market indicators displaying data
- [ ] Watchlist functionality works
- [ ] IPO section shows data
- [ ] No console errors in browser dev tools

### 2. **Test ML Backend**
- [ ] Health endpoint responds: `<ml-url>/health`
- [ ] Can analyze stocks via API
- [ ] Returns predictions without errors

### 3. **Test Scheduled Function**
- [ ] Function app is running
- [ ] Timer trigger is enabled
- [ ] Manual trigger works
- [ ] Check execution history in Azure Portal
- [ ] Verify logs show successful completion
- [ ] Database has updated stock data

### 4. **Check Database**
- [ ] Can connect to Azure SQL Database
- [ ] Tables created and populated
- [ ] Stock recommendations table has data
- [ ] Watchlist table exists
- [ ] IPO table has entries

### 5. **Monitor Performance**
- [ ] Application Insights collecting data
- [ ] No errors in Application Insights
- [ ] Response times acceptable (< 3 seconds)
- [ ] No failed requests

---

## 🔒 Security Hardening (Recommended After Testing)

### 1. **SQL Database**
- [ ] Remove "AllowAllIPs" firewall rule:
  ```powershell
  az sql server firewall-rule delete --name AllowAllIPs --server <sql-server> --resource-group rg-stockwiseinvest-prod
  ```
- [ ] Keep only "AllowAzureServices" rule
- [ ] Add specific IPs if needed for management

### 2. **API Keys to Key Vault**
- [ ] Store GROQ_API_KEY in Key Vault
- [ ] Store FINNHUB_API_KEY in Key Vault
- [ ] Store HUGGINGFACE_API_KEY in Key Vault
- [ ] Update app settings to reference Key Vault:
  ```powershell
  az webapp config appsettings set --settings GROQ_API_KEY="@Microsoft.KeyVault(SecretUri=...)"
  ```

### 3. **Enable Managed Identity Access**
- [ ] Grant web app identity access to Key Vault
- [ ] Grant function app identity access to SQL Database
- [ ] Enable RBAC on Key Vault

### 4. **App Service Configuration**
- [ ] Enable HTTPS only (already done)
- [ ] Disable FTP (already done)
- [ ] Enable App Service authentication (optional)
- [ ] Configure custom domain with SSL (optional)

---

## 📊 Monitoring Setup

### 1. **Application Insights Alerts**
- [ ] Set up alert for failed requests > 10%
- [ ] Set up alert for response time > 5 seconds
- [ ] Set up alert for CPU usage > 80%
- [ ] Configure email notifications

### 2. **Cost Alerts**
- [ ] Set up budget in Azure Portal ($150/month recommended)
- [ ] Enable email notifications at 80% threshold
- [ ] Review costs weekly initially

### 3. **Function Monitoring**
- [ ] Enable function execution logging
- [ ] Set up alert for function failures
- [ ] Monitor function execution times

---

## 💰 Cost Management

### 1. **Review Current Costs**
- [ ] Go to Azure Portal → Cost Management
- [ ] Check current month spending
- [ ] Verify against estimate (~$95/month)

### 2. **Optimize if Needed**
- [ ] Scale down to B1 if traffic is low ($50/month savings)
- [ ] Use Basic SQL tier for dev/test ($10/month savings)
- [ ] Stop apps when not in use

### 3. **Set Up Budget**
- [ ] Create budget in Azure Portal
- [ ] Set limit: $150/month (with buffer)
- [ ] Enable alerts at 50%, 80%, 100%

---

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review Application Insights for errors
- [ ] Check function execution logs
- [ ] Verify scheduled updates running correctly
- [ ] Monitor database size

### Monthly
- [ ] Review and optimize SQL queries
- [ ] Check for ML model drift
- [ ] Update dependencies if needed
- [ ] Review cost and usage patterns

### Quarterly
- [ ] Update Node.js and Python versions
- [ ] Review security recommendations in Azure Portal
- [ ] Optimize resource allocation
- [ ] Test disaster recovery

---

## 🆘 Troubleshooting Checklist

### If Web App Won't Start:
- [ ] Check deployment logs in Azure Portal
- [ ] Verify NODE_ENV=production is set
- [ ] Check DATABASE_URL is correct
- [ ] Look at log stream in Azure Portal
- [ ] Verify npm dependencies installed

### If Function Not Running:
- [ ] Check function status in Azure Portal
- [ ] Verify timer trigger is enabled
- [ ] Test manual trigger endpoint
- [ ] Check Python dependencies installed
- [ ] Verify database connection string

### If Database Connection Fails:
- [ ] Check firewall rules allow Azure services
- [ ] Verify connection string format
- [ ] Test connection with SQL Server Management Studio
- [ ] Check SQL Database is online

### If Costs Higher Than Expected:
- [ ] Review resource utilization
- [ ] Check for unexpected scaling
- [ ] Look for unused resources
- [ ] Review App Service Plan tier
- [ ] Check SQL Database DTU usage

---

## 📞 Support Resources

- **Azure Portal**: https://portal.azure.com
- **Azure Support**: Portal → Support + troubleshooting
- **Documentation**: Check `azure/README.md`
- **Pricing Calculator**: https://azure.microsoft.com/pricing/calculator/
- **Azure Status**: https://status.azure.com/status

---

## ✅ Deployment Complete Checklist

Mark each item as you complete it:

### Infrastructure
- [ ] All Azure resources created
- [ ] No deployment errors
- [ ] Resource group visible in portal

### Applications
- [ ] Web app deployed and accessible
- [ ] ML backend deployed and healthy
- [ ] Function app deployed and working

### Verification
- [ ] Web UI loads and functions
- [ ] Stock recommendations display
- [ ] Watchlist working
- [ ] Manual function trigger successful
- [ ] Database populated with data

### Security
- [ ] SQL firewall restricted
- [ ] API keys in Key Vault
- [ ] HTTPS enforced
- [ ] Managed identities configured

### Monitoring
- [ ] Application Insights collecting data
- [ ] Cost alerts configured
- [ ] Function execution monitoring enabled
- [ ] Email notifications set up

### Documentation
- [ ] Deployment info saved
- [ ] URLs documented
- [ ] Access credentials secure
- [ ] Runbook for updates created

---

## 🎉 Success!

If all items are checked, your deployment is complete and production-ready!

**Your application is now:**
- ✅ Live on Azure
- ✅ Automatically updating twice daily
- ✅ Monitored for errors
- ✅ Secured with best practices
- ✅ Scalable for growth

**Next steps:**
1. Share the URL with users
2. Monitor performance for first week
3. Optimize based on usage patterns
4. Plan for custom domain (optional)

**Congratulations! 🚀📈**
