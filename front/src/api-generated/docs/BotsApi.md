# BotsApi

All URIs are relative to *http://localhost:3000/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getBots**](#getbots) | **GET** /bots | 获取所有可用机器人|

# **getBots**
> GetBots200Response getBots()


### Example

```typescript
import {
    BotsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BotsApi(configuration);

const { status, data } = await apiInstance.getBots();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**GetBots200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

