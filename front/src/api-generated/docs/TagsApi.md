# TagsApi

All URIs are relative to *http://localhost:3000/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getTags**](#gettags) | **GET** /tags | 获取用户使用过的所有标签|

# **getTags**
> GetTags200Response getTags()


### Example

```typescript
import {
    TagsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TagsApi(configuration);

const { status, data } = await apiInstance.getTags();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**GetTags200Response**

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

