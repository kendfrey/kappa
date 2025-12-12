import { produce } from "immer";
import { useCallback, useEffect, useState } from "react";

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
): [T, Updater<T>]
{
	const [value, setValue] = useState(() =>
	{
		const storedValue = localStorage.getItem(key);
		if (storedValue !== null)
		{
			try
			{
				return JSON.parse(storedValue) as T;
			}
			catch
			{
				// Ignore parse errors
			}
		}

		return defaultValue;
	});

	const updateValue = useCallback((recipe: (draft: T) => void) =>
	{
		setValue(t => produce(t, recipe));
	}, [setValue]);

	useEffect(() =>
	{
		localStorage.setItem(key, JSON.stringify(value));
	}, [value, key]);

	return [value, updateValue];
}
