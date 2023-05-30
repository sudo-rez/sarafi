package util

func ArrayToJsonString(arr []string) string {
	var result = "["
	for i, v := range arr {
		result += v
		if i != len(arr)-1 {
			result += ","
		}
	}
	result += "]"
	return result
}
