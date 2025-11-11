import { produce } from "immer";
import { useCallback, useMemo, useRef, useState } from "react";
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

export function useProjection<T, U>(value: T, updateValue: Updater<T>, f: (value: T) => U): [U, Updater<U>]
{
	const projectedValue = useMemo(() => f(value), [value, f]);
	const updateProjectedValue = useCallback((recipe: (draft: U) => void) =>
	{
		updateValue(draft =>
		{
			recipe(f(draft));
		});
	}, [updateValue, f]);
	return [projectedValue, updateProjectedValue];
}

export function useRefState<T>(initialValue: T): [T, React.RefObject<T>, React.Dispatch<React.SetStateAction<T>>]
{
	const ref = useRef(initialValue);
	const [state, setState] = useState(initialValue);
	const setValue = useCallback((newValue: React.SetStateAction<T>) =>
	{
		if (typeof newValue === "function")
			ref.current = (newValue as (prevState: T) => T)(ref.current);
		else
			ref.current = newValue;
		setState(ref.current);
	}, []);
	return [state, ref, setValue];
}
