# Message


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**conversationId** | **string** |  | [optional] [default to undefined]
**groupConversationId** | **string** |  | [optional] [default to undefined]
**senderId** | **string** |  | [optional] [default to undefined]
**senderType** | **string** |  | [optional] [default to undefined]
**senderName** | **string** | 发送者名称（群组消息中使用） | [optional] [default to undefined]
**content** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** |  | [optional] [default to undefined]
**aiError** | **boolean** |  | [optional] [default to false]
**errorMessage** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { Message } from './api';

const instance: Message = {
    id,
    conversationId,
    groupConversationId,
    senderId,
    senderType,
    senderName,
    content,
    createdAt,
    aiError,
    errorMessage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
