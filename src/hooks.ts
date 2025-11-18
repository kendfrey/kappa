import { produce } from "immer";
import { useCallback, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

export type Updater<T> = (recipe: (draft: T) => void) => void;

export function useImmerState<T>(initialValue: T | (() => T)): [T, Updater<T>]
{
	const [value, setValue] = useState(initialValue);
	const updateValue = useCallback((recipe: (draft: T) => void) =>
	{
		setValue(t => produce(t, recipe));
	}, []);
	return [value, updateValue];
}

type SerializableValue =
	| string
	| number
	| boolean
	| null
	| readonly SerializableValue[]
	| { readonly [key: string]: SerializableValue; };

export function useImmerLocalStorage<T extends SerializableValue>(
	key: string,
	defaultValue: T,
): [T, Updater<T>, () => void]
{
	const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);
	const updateValue = useCallback((recipe: (draft: T) => void) =>
	{
		setValue(t => produce(t, recipe));
	}, [setValue]);
	return [value, updateValue, removeValue];
}
