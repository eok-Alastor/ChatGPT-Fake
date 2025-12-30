# Conversation


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**userId** | **string** |  | [optional] [default to undefined]
**title** | **string** |  | [optional] [default to undefined]
**tags** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**createdAt** | **string** |  | [optional] [default to undefined]
**updatedAt** | **string** |  | [optional] [default to undefined]
**lastMessage** | [**Message**](Message.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Conversation } from './api';

const instance: Conversation = {
    id,
    userId,
    title,
    tags,
    createdAt,
    updatedAt,
    lastMessage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
